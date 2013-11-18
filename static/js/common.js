/*

Copyright (c) 2013, salesforce.com, Inc. All rights reserved.

Redistribution and use in source and binary forms, with or without modification, 
are permitted provided that the following conditions are met:

    * Redistributions of source code must retain the above copyright notice, 
    this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright notice, 
    this list of conditions and the following disclaimer in the documentation 
    and/or other materials provided with the distribution.
    * Neither the name of the salesforce.com, Inc. nor the names of its contributors 
    may be used to endorse or promote products derived from this software 
    without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND 
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED 
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. 
IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, 
INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, 
BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, 
DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF 
LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE 
OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED 
OF THE POSSIBILITY OF SUCH DAMAGE.

*/


;(function() {
    var app = window.MyCharts = window.MyCharts || {};

    /*************************************************************************/

    app.getQueryStrings = function() {
        var assoc = {};
        var decode = function (s) {
            return decodeURIComponent(s.replace(/\+/g, " "));
        };
        var queryString = location.search.substring(1);
        var keyValues = queryString.split('&');
        for(var i in keyValues) {
            var key = keyValues[i].split('=');
            if (key.length > 1) {
                assoc[decode(key[0])] = decode(key[1]);
            }
        }
        return assoc;
    };

    /*************************************************************************/

    app.createApi = function(sessionId, namespace, pageName) {
        var qs = app.getQueryStrings();
        var api = {
            sessionId: qs['apiSessionId'] || sessionId,
            version: qs['reportApiVersion'] || 'v29.0'
        };
        var client = new forcetk.Client();
        if (window.location.host.indexOf('gwf.') == 0)
            client.namespace = 'gwf';
        client.reportMetadata = {};
        client.setSessionToken(api.sessionId, api.version);
        client.proxyUrl = null;
        client.instanceUrl = '';
        client.setIncludeDetails(true);
        client.baseUrl = window.location.protocol + '//' +
            window.location.hostname;

        if (pageName.indexOf(namespace + '__') == 0) {
            client.namespace = namespace;
            client.apexPrefix = '/apex/' + namespace + '__';
        }
        else {
            client.namespace = null;
            client.apexPrefix = '/apex/';
        }

        api.client = client;

        return api;
    };

    /*************************************************************************/

    app.renderToImage = function(src, maxWidth, maxHeight) {
        src = src.find('svg:first');
        var srcWidth = src.width(), srcHeight = src.height();
        var scale = Math.min(maxWidth / srcWidth, maxHeight / srcHeight);
        var width = scale * srcWidth, height = scale * srcHeight;

        var canvas = $('<canvas />')
                .attr({ width: width, height: height })
                .css({ position: 'absolute',
                       top: -srcHeight,
                       left: -srcWidth,
                       width: srcWidth,
                       height: srcHeight
                     })
                .appendTo('body');

        canvg(canvas[0], src.parent().html(),
              { scaleWidth: srcWidth, scaleHeight: srcHeight });

        var miniCanvas = $('<canvas />')
                .attr({ width: width, height: height })
                .css({ position: 'absolute',
                       top: -height,
                       left: -width,
                       width: width,
                       height: height
                     })
                .appendTo('body');

        var tCtx = miniCanvas[0].getContext("2d");
        tCtx.drawImage(canvas[0],0,0,width,height);
        var imgData = miniCanvas[0].toDataURL("image/png");
        canvas.remove();
        miniCanvas.remove();
        return imgData;
    };

    /*********************************************************************/

    var $wait = null;

    /*********************************************************************/

    function animateWait() {
        $wait.fadeTo(1000, 0.75, function() {
            $wait.fadeTo(1000, 0.25, function() {
                // uncomment to cycle the fading animation.
                // setTimeout(animateWait, 0);
            });
        });
    }

    /*********************************************************************/

    app.startWaiting = function() {
        if ($wait || !app.isMobile())
            return;
        $wait = $('<div/>').css({
            top: 0, left: 0, width: '100%', height: '100%',
            position: 'fixed', background: '#FFF', opacity: 0
        });
        $wait.appendTo('body');
        animateWait();
    },


    /*********************************************************************/

    app.stopWaiting = function() {
        if (!$wait || !app.isMobile())
            return;
        $wait.stop().fadeOut(100, function () {
            $wait.remove();
            $wait = null;
        });
    },


    /*************************************************************************/

    app.isMobile = function() {
        return typeof sforce !== 'undefined' && !!(sforce.one);
    };

    /*************************************************************************/

    // Lightbox pages should call this function from their onload handler. It sets
    // up the background view to capture clicks and close the lightbox.
    app.lightboxOnLoad = function($el, isEmbed) {
        var bgDiv = $('<div />');
        bgDiv.prependTo('body').css({
            position: 'fixed',
            width: '100%',
            height: '100%'
        }).click(function() {
            window.parent.postMessage('close', '*');
        });

        if (isEmbed)
            $el && $el.addClass('embedChartApp');
        else
            $el && $el.addClass('borderedChartApp');
    };

})();
