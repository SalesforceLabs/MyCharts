#MyChart

## Introduction

MyCharts is a Visual Force package that works on both desktop browsers
and the new Salesforce1 mobile experience.  MyCharts provides a simple
and dynamic interface for creating charts that can be easily modified
and shared with others in your organization.

MyCharts is not intended as a replacement for the existing charts and
dashboards in salesforce.com.  Instead, MyCharts has three properties
that make it complement the existing built-in charts.  First, MyCharts
is built with Google Charts, so users that are more familiar with
Google Charts may prefer it, especially since it includes a couple of
chart types that are not part of the built-in salesforce.com charts.
Second, MyCharts is written with the latest HTML5 capabilities, which
allows for chart creation to be much quicker and flexible.  Third,
MyCharts is built on top of the latest version of the salesforce.com
analytics API and will, therefore, serve as a sort of reference
implementation for how customers can extend the salesforce.com
platform with their own customized solutions.

The existing charts within salesforce.com have several capabilities
that MyCharts lacks, so if you critically depend on any of these
features you will want to continue to use salesforce.com's built-in
charts alone or in combination with MyCharts.  For example, the
built-in charts can be customized in ways that MyCharts cannot and
they can also be embedded in other locations.  Another critical
difference is that the built-in charts can be composed into a larger
dashboard of charts that can be updated in bulk.  MyCharts provides
you with it's own dashboard of charts, but they can only be updated
individually.  Finally, the built-in charts are integrated within the
existing reporting UI, making the workflow from report, to chart, to
dashboard, a more integrated experience.  By way of comparison,
MyCharts is more of an independent experience; you make MyCharts
charts by selecting a previously defined report, and you can post
a MyChart chart to Chatter, but it is not as integrated with the
reporting UI as built-in charts are.

NB: Throughout this document we consistently refer to MyCharts by the
single name of "MyCharts".  However, this package has occasionally
been referred to as "My Insights".  As a result, while following the
instructions you may need to mentally replace "MyCharts" with "My
Insights" or even "Show Insights"


## Installation

MyCharts will eventually be distributed as a force.com package but is
available now as an unmanaged package.  In either case, most of the
installation process in automatic.  Before installing the MyCharts
package you will need to insure that your instance of salesforce.com
satisfies the following two requirements.

First, since MyCharts integrates with the new Salesforce1 mobile
experience, you can only install and use MyCharts on version 186+.

Second, MyCharts makes use of version 29.0 of the salesforce.com API,
so your salesforce instance must support that newer API as well.

Once the MyCharts package is installed, there are four manual steps
that an administrator can perform in order to fully activate MyCharts
within an organization.

### Security Profiles

MyCharts makes use of custom objects with custom fields.  As a result,
any user which can view and create a MyChart chart needs to be part of
a security profile that has read, write, update, and delete privileges
for the MyChart__c custom object.  We suggest that you further specify
that all access to any MyChart__c object is world-readable, but that
only the owner of a MyChart__c object can delete and update a given
chart.

If you update the standard user profiles to include these privileges,
then all new users will be able to use MyCharts.  Or, you can create a
new profile that includes the required privileges and selectively add
users to that new profile, allowing you to more selectively grant
access to MyCharts.

If you are in an environment where you simply want to experiment or
demo MyCharts, then you can run MyCharts as an administrator and
dispense with the need for creating or modifying security profiles.


### Enabling MyCharts in Salesforce1 Stage-left

Once MyCharts is installed, a new Visualforce Tab named "MyCharts" is
automatically added to the organization.  If you would like users of
Salesforce1 to have easy access to MyCharts via the stage-left
navigation, then you will need to manually add the tab to the mobile
configuration.

From setup, go to the new section on Mobile Navigation.  From there,
you should see an option to add MyCharts to the list of mobile
navigation menu items.  Adding the tab will immediately enable it on
Salesforce1 for all users.


### Enabling MyCharts as a Salesforce1 MDP action

Installing the MyCharts package will also create a Global Action named
"MyCharts" that triggers the chart creation UI.  To enable MyCharts as
an MDP action, add the MyCharts Global Action to the list of Publisher
Action in the Publisher Layouts setup section.

One side-effect of adding a Publisher Action is that it will also add
MyCharts as a new Chatter post type to the desktop experience.  At
this time, MyCharts has not been designed for this case nor is their
anyway of disabling the new Chatter post type without disabling the
corresponding MDP action.  As a result, we suggest that when you add
MyCharts as a Publisher Action, that you place it in any position
other than the first action.  Doing so will prevent MyCharts from
being the default Chatter posting experience.


### Enabling MyCharts Desktop Tab

Since the MyCharts package contains a Visualforce Tab, you may also
want the tab to be accessible for all desktop users, since it is the
easiest way to access your MyChart charts.


## User Guide

MyCharts has a very simple user interface that is nearly identical in
the desktop and mobile versions.

You access all of your MyCharts charts by clicking on the MyCharts
tab (desktop), clicking on the stage-left icon (mobile), or by
directly navigating to /apex/MyCharts on desktop.

When looking at all of your charts, the charts shown are actually
thumbnail images and, therefore, static in that state.  The desktop
version of MyCharts has three controls per chart that become visible
when the mouse is hovered over a particular chart.  Those controls
allow you to share, edit, or delete a chart.  We describe each of
these actions more fully below.

Clicking on a chart in either mobile or desktop opens up a "live"
version of the chart. Live charts are no longer images and may have
some dynamic interaction available by either hovering over or clicking
on different portions of the chart.

From the live version of a chart, you can also edit, share, or delete
the chart.

When you create a chart, the very first step is to pick a report that
will generate the chart's data.  The report picker will show only
those reports that are in your personal folder of custom reports.  For
demo purposes, you will want to make sure that you have created
suitable reports in advance.

Any chart that you create must be derived from a report which is saved
with summary or matrix format, and scatter charts have the additional
requirement that they have at least two numerical values as part of
the report output.  MyCharts cannot determine at run time if a report
fulfills these requirements.  As a result, it is possible to pick a
report that is unsuitable for making a chart, so we suggest that when
giving demos you appropriately prune the reports that are in your
personal folder.

When you edit a chart, you can dynamically switch between different
chart types, which include horizontal and vertical bar, pie, line,
area, stepped area, scatter, or tree map.  You can also edit the title
of the chart.  If you need a chart to be derived from a different
report than the one it was created with, you must create a new chart.

Charts can be shared to Chatter with the share button.  When sharing,
you can specify a feed and also some text to include in the post.  A
MyChart Chatter post will contain a link to the chart.  The owner of a
chart can edit the chart's properties from this link, and others can
view the chart.


## Known Issues

At this time, MyCharts is suitable for demo purpose but it is not
ready for general availability for customers.  It will, however, be
ready for general availability in time for Dreamforce FY15.

1. Accessing a chart from the feed, editing it, and saving it, will
create an entirely new chart instead of editing the original chart.
Accessing the chart from stage-left or from the tab will mitigate this
problem.

2. Current builds of Salesforce1 can yield a corrupted history stack
when accessing a chart from the feed.  This bug will sometimes yield a
blank screen after hitting the back arrow, or it will have a chart and
a chart list superimposed on one another.  Restart the feed or
MyCharts from stage-left to clear this issue.

3. Current builds of Salesforce do not properly handle a backward
navigation that is triggered from an app.  As a result, deleting or
sharing a chart will often incorrectly navigate back to the feed, even
if the feed was not the starting point.

4. Each chatter posting of a Chart creates a new file upload.
However, when a chart is removed, the chart's thumbnail remains on the
server.

5. Deleting a chart that has a chatter post associated with it will
make the link in the chatter post invalid.






