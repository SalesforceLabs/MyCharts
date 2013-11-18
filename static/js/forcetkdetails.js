/*
 * Copyright (c) 2011, salesforce.com, inc.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification, are permitted provided
 * that the following conditions are met:
 *
 * Redistributions of source code must retain the above copyright notice, this list of conditions and the
 * following disclaimer.
 *
 * Redistributions in binary form must reproduce the above copyright notice, this list of conditions and
 * the following disclaimer in the documentation and/or other materials provided with the distribution.
 *
 * Neither the name of salesforce.com, inc. nor the names of its contributors may be used to endorse or
 * promote products derived from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED
 * WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A
 * PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
 * ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED
 * TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
 * HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
 * NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 * POSSIBILITY OF SUCH DAMAGE.
 */

/* JavaScript library to wrap REST API on Visualforce. Leverages Ajax Proxy
 * (see http://bit.ly/sforce_ajax_proxy for details).
 *
 * Note that you must add the REST endpoint hostname for your instance (i.e.
 * https://na1.salesforce.com/ or similar) as a remote site - in the admin
 * console, go to Your Name | Setup | Security Controls | Remote Site Settings
 *
 * Nov 2013 - Added mangle / demangle code to handle managed package namespaces.
 *            This is very inelegant because all substrings that look like custom
 *            entities will be rewritten.  The right way to do this is via the
 *            defaultNamespace header, but that's only availabl in SOAP APIs at
 *            the moment.  (Gary Flake, gflake@salesforce.com)
 */

var forcetk = window.forcetk;

if (forcetk === undefined) {
    forcetk = {};
}

if (forcetk.Client === undefined) {

    // We use $j rather than $ for jQuery so it works in Visualforce
    if (window.$j === undefined) {
        $j = $;
    }


    /**
     * Converts a string so that anything that looks like a custom object
     * or field name is rewritten with a namespace prefix.  In general,
     * this is a very heavy handed procedure in that it can easily yield
     * yields undesirable results.  However, at this time there isn't a more
     * more elegant option available.
     */
    function mangleString(namespace, str) {
        if (!namespace || !str)
            return str;
        var re = /([a-zA-Z_][a-zA-Z0-9_]*)__c\b/g;
        var repStr = namespace + '__$1__c';
        return str.replace(re, repStr);
    }


    /**
     * Converts a string so that anything that looks like a prefixed custom
     * object or field name is rewritten without a namespace prefix.  In general,
     * this is a very heavy handed procedure in that it can easily yield
     * yields undesirable results.  However, at this time there isn't a more
     * more elegant option available.
     */
    function demangleString(namespace, str) {
        if (!namespace || !str)
            return str;
        var reStr = '\\b' + namespace +
            '__([a-zA-Z_][a-zA-Z0-9_]*__c)\\b'
        var re = new RegExp(reStr, 'g');
        return str.replace(re, '$1');
    }


    /**
     * The Client provides a convenient wrapper for the Force.com REST API,
     * allowing JavaScript in Visualforce pages to use the API via the Ajax
     * Proxy.
     * @param [clientId=null] 'Consumer Key' in the Remote Access app settings
     * @param [loginUrl='https://login.salesforce.com/'] Login endpoint
     * @param [proxyUrl=null] Proxy URL. Omit if running on Visualforce or
     *                  PhoneGap etc
     * @constructor
     */
    forcetk.Client = function(clientId, loginUrl, proxyUrl) {
        this.clientId = clientId;
        this.loginUrl = loginUrl || 'https://test.salesforce.com';
        if (typeof proxyUrl === 'undefined' || proxyUrl === null) {
            if (location.protocol === 'file:') {
                // In PhoneGap
                this.proxyUrl = null;
            } else {
                // In Visualforce
                this.proxyUrl = location.protocol + "//" + location.hostname
                    + "/services/proxy";
            }
            this.authzHeader = "Authorization";
        } else {
            // On a server outside VF
            this.proxyUrl = proxyUrl;
            this.authzHeader = "X-Authorization";
        }
        this.refreshToken = null;
        this.sessionId = null;
        this.apiVersion = null;
        this.instanceUrl = null;
        this.asyncAjax = true;
    }

    /**
     * Set a refresh token in the client.
     * @param refreshToken an OAuth refresh token
     */
    forcetk.Client.prototype.setRefreshToken = function(refreshToken) {
        this.refreshToken = refreshToken;
    }

    /**
     * Refresh the access token.
     * @param callback function to call on success
     * @param error function to call on failure
     */
    forcetk.Client.prototype.refreshAccessToken = function(callback, error) {
        var that = this;
        var url = this.loginUrl + '/services/oauth2/token';
        return $j.ajax({
            type: 'POST',
            url: url,
            cache: false,
            processData: false,
            data: 'grant_type=refresh_token&client_id=' + this.clientId + '&refresh_token=' + this.refreshToken,
            success: callback,
            error: error,
            dataType: "json",
            beforeSend: function(xhr) {
                if (that.proxyUrl !== null) {
                    xhr.setRequestHeader('SalesforceProxy-Endpoint', url);
                }
            }
        });
    }

    /**
     * Set a session token and the associated metadata in the client.
     * @param sessionId a salesforce.com session ID. In a Visualforce page,
     *                   use '{!$Api.sessionId}' to obtain a session ID.
     * @param [apiVersion="21.0"] Force.com API version
     * @param [instanceUrl] Omit this if running on Visualforce; otherwise
     *                   use the value from the OAuth token.
     */
    forcetk.Client.prototype.setSessionToken = function(sessionId, apiVersion, instanceUrl) {
        this.sessionId = sessionId;
        this.apiVersion = (typeof apiVersion === 'undefined' || apiVersion === null)
        ? 'v27.0': apiVersion;
        if (typeof instanceUrl === 'undefined' || instanceUrl == null) {
            // location.hostname can be of the form 'abc.na1.visual.force.com',
            // 'na1.salesforce.com' or 'abc.my.salesforce.com' (custom domains).
            // Split on '.', and take the [1] or [0] element as appropriate
            var elements = location.hostname.split(".");

            var instance = null;
            if(elements.length == 4 && elements[1] === 'my') {
                instance = elements[0] + '.' + elements[1];
            } else if(elements.length == 3){
                instance = elements[0];
            } else {
                instance = elements[1];
            }

            this.instanceUrl = "https://" + instance + ".salesforce.com";
        } else {
            this.instanceUrl = instanceUrl;
        }
    }

    /*
     * Low level utility function to call the Salesforce endpoint.
     * @param path resource path relative to /services/data
     * @param callback function to which response will be passed
     * @param [error=null] function to which jqXHR will be passed in case of error
     * @param [method="GET"] HTTP method for call
     * @param [payload=null] payload for POST/PATCH etc
     */
    forcetk.Client.prototype.ajax = function(path, callback, error, method, payload, retry) {
        var that = this;
        path = mangleString(this.namespace, path)
        var url = this.instanceUrl + '/services/data' + path;
        payload = mangleString(this.namespace, payload);

        return $j.ajax({
            type: method || "GET",
            async: this.asyncAjax,
            url: (this.proxyUrl !== null) ? this.proxyUrl: url,
            contentType: 'application/json',
            cache: false,
            processData: false,
            data: payload,
            dataFilter: function(data, type) {
                return demangleString(that.namespace, data);
            },
            success: callback,
            error: (!this.refreshToken || retry ) ? error : function(jqXHR, textStatus, errorThrown) {
                if (jqXHR.status === 401) {
                    that.refreshAccessToken(function(oauthResponse) {
                        that.setSessionToken(oauthResponse.access_token, null,
                        oauthResponse.instance_url);
                        that.ajax(path, callback, error, method, payload, true);
                    },
                    error);
                } else {
                    error(jqXHR, textStatus, errorThrown);
                }
            },
            dataType: "json",
            beforeSend: function(xhr) {
                if (that.proxyUrl !== null) {
                    xhr.setRequestHeader('SalesforceProxy-Endpoint', url);
                }
                xhr.setRequestHeader(that.authzHeader, "OAuth " + that.sessionId);
                xhr.setRequestHeader('X-User-Agent', 'salesforce-toolkit-rest-javascript/' +
				     that.apiVersion);
            }
        });
    }

    /**
     * Utility function to query the Chatter API and download a file
     * Note, raw XMLHttpRequest because JQuery mangles the arraybuffer
     * This should work on any browser that supports XMLHttpRequest 2 because arraybuffer is required.
     * For mobile, that means iOS >= 5 and Android >= Honeycomb
     * @author Tom Gersic
     * @param path resource path relative to /services/data
     * @param mimetype of the file
     * @param callback function to which response will be passed
     * @param [error=null] function to which request will be passed in case of error
     * @param rety true if we've already tried refresh token flow once
     **/
    forcetk.Client.prototype.getChatterFile = function(path,mimeType,callback,error,retry) {
        var that = this;
        var url = this.instanceUrl + mangleString(this.namespace, path);

        var request = new XMLHttpRequest();

        request.open("GET",  url, true);
        request.responseType = "arraybuffer";

        request.setRequestHeader(that.authzHeader, "OAuth " + that.sessionId);
        request.setRequestHeader('X-User-Agent', 'salesforce-toolkit-rest-javascript/' + that.apiVersion);
        if (this.proxyUrl !== null) {
            request.setRequestHeader('SalesforceProxy-Endpoint', url);
        }

        request.onreadystatechange = function() {
            // continue if the process is completed
            if (request.readyState == 4) {
                // continue only if HTTP status is "OK"
                if (request.status == 200) {
                    try {
                        // retrieve the response
                        callback(request.response);
                    }
                    catch(e) {
                        // display error message
                        alert("Error reading the response: " + e.toString());
                    }
                }
                //refresh token in 401
                else if(request.status == 401 && !retry) {
                    that.refreshAccessToken(function(oauthResponse) {
                        that.setSessionToken(oauthResponse.access_token, null,oauthResponse.instance_url);
                        that.getChatterFile(path, mimeType, callback, error, true);
                    },
                    error);
                }
                else {
                    // display status message
                    error(request,request.statusText,request.response);
                }
            }

        }

        request.send();

    }

    /*
     * Low level utility function to call the Salesforce endpoint specific for Apex REST API.
     * @param path resource path relative to /services/apexrest
     * @param callback function to which response will be passed
     * @param [error=null] function to which jqXHR will be passed in case of error
     * @param [method="GET"] HTTP method for call
     * @param [payload=null] payload for POST/PATCH etc
     */
    forcetk.Client.prototype.apexrest = function(path, callback, error, method, payload, retry) {
        var that = this;
        path = mangleString(this.namespace, path);
        var url = this.instanceUrl + '/services/apexrest' + path;

        return $j.ajax({
            type: method || "GET",
            async: this.asyncAjax,
            url: url,
            contentType: 'application/json',
            cache: false,
            processData: false,
            data: payload,
            success: callback,
            error: (!this.refreshToken || retry ) ? error : function(jqXHR, textStatus, errorThrown) {
                if (jqXHR.status === 401) {
                    that.refreshAccessToken(function(oauthResponse) {
                        that.setSessionToken(oauthResponse.access_token, null,
                        oauthResponse.instance_url);
                        that.ajax(path, callback, error, method, payload, true);
                    },
                    error);
                } else {
                    error(jqXHR, textStatus, errorThrown);
                }
            },
            dataType: "json",
            beforeSend: function(xhr) {
                if (that.proxyUrl !== null) {
                    xhr.setRequestHeader('SalesforceProxy-Endpoint', url);
                }
                xhr.setRequestHeader(that.authzHeader, "OAuth " + that.sessionId);
                xhr.setRequestHeader("accept-encoding", "gzip");
                xhr.setRequestHeader('X-User-Agent', 'salesforce-toolkit-rest-javascript/' + that.apiVersion);
            }
        });
    }

    /*
     * Lists summary information about each Salesforce.com version currently
     * available, including the version, label, and a link to each version's
     * root.
     * @param callback function to which response will be passed
     * @param [error=null] function to which jqXHR will be passed in case of error
     */
    forcetk.Client.prototype.versions = function(callback, error) {
        return this.ajax('/', callback, error);
    }

    /*
     * Lists available resources for the client's API version, including
     * resource name and URI.
     * @param callback function to which response will be passed
     * @param [error=null] function to which jqXHR will be passed in case of error
     */
    forcetk.Client.prototype.resources = function(callback, error) {
        return this.ajax('/' + this.apiVersion + '/', callback, error);
    }

    /*
     * Lists the available objects and their metadata for your organization's
     * data.
     * @param callback function to which response will be passed
     * @param [error=null] function to which jqXHR will be passed in case of error
     */
    forcetk.Client.prototype.describeGlobal = function(callback, error) {
        return this.ajax('/' + this.apiVersion + '/sobjects/', callback, error);
    }

    /*
     * Describes the individual metadata for the specified object.
     * @param objtype object type; e.g. "Account"
     * @param callback function to which response will be passed
     * @param [error=null] function to which jqXHR will be passed in case of error
     */
    forcetk.Client.prototype.metadata = function(objtype, callback, error) {
        return this.ajax('/' + this.apiVersion + '/sobjects/' + objtype + '/'
        , callback, error);
    }

    forcetk.Client.prototype.setIncludeDetails = function(includeDetails) {
    	this.includeDetails = true;
    }

    /*
     * run report
     */
    forcetk.Client.prototype.runReport = function(reportId, callback, error) {
    	var url = '/' + this.apiVersion + '/analytics/reports/' + reportId;
    	if (this.includeDetails) {
    		url +='?includeDetails=true';
    	}
        return this.ajax(url, callback, error);
    }

	/*
     * get report instances - previously run async reports
	 */
	forcetk.Client.prototype.getReportInstances = function(reportId, callback, error) {
        return this.ajax('/' + this.apiVersion + '/analytics/reports/' + reportId  + '/instances'
        , callback, error);

	}

	/*
	 * get report instance
	 */
	forcetk.Client.prototype.getReportInstance = function(reportId, instanceId, callback, error) {
        return this.ajax('/' + this.apiVersion + '/analytics/reports/' + reportId  + '/instances/' + instanceId
        , callback, error);

	}

    /*
     * run report with dynamic filters
     */
    forcetk.Client.prototype.runReportPost = function(reportId, reportMd, callback, error) {
    	var url = '/' + this.apiVersion + '/analytics/reports/' + reportId;
    	if (this.includeDetails) {
    		url +='?includeDetails=true';
    	}
        return this.ajax(url, callback, error, 'POST', reportMd);
    }

	/*
     * run report async with dynamic filters
     */
    forcetk.Client.prototype.runReportAsync = function(reportId, reportMd, callback, error) {
        return this.ajax('/' + this.apiVersion + '/analytics/reports/' + reportId  + '/instances'
        , callback, error, 'POST', reportMd);
    }

    /*
     * describe report
     */
    forcetk.Client.prototype.describeReport = function(reportId, callback, error) {
        return this.ajax('/' + this.apiVersion + '/analytics/reports/' + reportId + '/describe'
        , callback, error);
    }
    /*
     * Completely describes the individual metadata at all levels for the
     * specified object.
     * @param objtype object type; e.g. "Account"
     * @param callback function to which response will be passed
     * @param [error=null] function to which jqXHR will be passed in case of error
     */
    forcetk.Client.prototype.describe = function(objtype, callback, error) {
        return this.ajax('/' + this.apiVersion + '/sobjects/' + objtype
        + '/describe/', callback, error);
    }



    /*
     * Creates a new record of the given type.
     * @param objtype object type; e.g. "Account"
     * @param fields an object containing initial field names and values for
     *               the record, e.g. {:Name "salesforce.com", :TickerSymbol
     *               "CRM"}
     * @param callback function to which response will be passed
     * @param [error=null] function to which jqXHR will be passed in case of error
     */
    forcetk.Client.prototype.create = function(objtype, fields, callback, error) {
        return this.ajax('/' + this.apiVersion + '/sobjects/' + objtype + '/',
            callback, error, "POST", JSON.stringify(fields));
    }

    /*
     * Retrieves field values for a record of the given type.
     * @param objtype object type; e.g. "Account"
     * @param id the record's object ID
     * @param [fields=null] optional comma-separated list of fields for which
     *               to return values; e.g. Name,Industry,TickerSymbol
     * @param callback function to which response will be passed
     * @param [error=null] function to which jqXHR will be passed in case of error
     */
    forcetk.Client.prototype.retrieve = function(objtype, id, fieldlist, callback, error) {
        if (!arguments[4]) {
            error = callback;
            callback = fieldlist;
            fieldlist = null;
        }
        var fields = fieldlist ? '?fields=' + fieldlist : '';
        return this.ajax('/' + this.apiVersion + '/sobjects/' + objtype + '/' + id
        + fields, callback, error);
    }

    /*
     * Upsert - creates or updates record of the given type, based on the
     * given external Id.
     * @param objtype object type; e.g. "Account"
     * @param externalIdField external ID field name; e.g. "accountMaster__c"
     * @param externalId the record's external ID value
     * @param fields an object containing field names and values for
     *               the record, e.g. {:Name "salesforce.com", :TickerSymbol
     *               "CRM"}
     * @param callback function to which response will be passed
     * @param [error=null] function to which jqXHR will be passed in case of error
     */
    forcetk.Client.prototype.upsert = function(objtype, externalIdField, externalId, fields, callback, error) {
        return this.ajax('/' + this.apiVersion + '/sobjects/' + objtype + '/' + externalIdField + '/' + externalId
        + '?_HttpMethod=PATCH', callback, error, "POST", JSON.stringify(fields));
    }

    /*
     * Updates field values on a record of the given type.
     * @param objtype object type; e.g. "Account"
     * @param id the record's object ID
     * @param fields an object containing initial field names and values for
     *               the record, e.g. {:Name "salesforce.com", :TickerSymbol
     *               "CRM"}
     * @param callback function to which response will be passed
     * @param [error=null] function to which jqXHR will be passed in case of error
     */
    forcetk.Client.prototype.update = function(objtype, id, fields, callback, error) {
        return this.ajax('/' + this.apiVersion + '/sobjects/' + objtype + '/' + id
        + '?_HttpMethod=PATCH', callback, error, "POST", JSON.stringify(fields));
    }

    /*
     * Deletes a record of the given type. Unfortunately, 'delete' is a
     * reserved word in JavaScript.
     * @param objtype object type; e.g. "Account"
     * @param id the record's object ID
     * @param callback function to which response will be passed
     * @param [error=null] function to which jqXHR will be passed in case of error
     */
    forcetk.Client.prototype.del = function(objtype, id, callback, error) {
        return this.ajax('/' + this.apiVersion + '/sobjects/' + objtype + '/' + id
        , callback, error, "DELETE");
    }

    /*
     * Executes the specified SOQL query.
     * @param soql a string containing the query to execute - e.g. "SELECT Id,
     *             Name from Account ORDER BY Name LIMIT 20"
     * @param callback function to which response will be passed
     * @param [error=null] function to which jqXHR will be passed in case of error
     */
    forcetk.Client.prototype.query = function(soql, callback, error) {
        return this.ajax('/' + this.apiVersion + '/query?q=' + escape(soql)
        , callback, error);
    }

    /*
     * Executes the specified SOSL search.
     * @param sosl a string containing the search to execute - e.g. "FIND
     *             {needle}"
     * @param callback function to which response will be passed
     * @param [error=null] function to which jqXHR will be passed in case of error
     */
    forcetk.Client.prototype.search = function(sosl, callback, error) {
        return this.ajax('/' + this.apiVersion + '/search?s=' + escape(sosl)
        , callback, error);
    }
}
