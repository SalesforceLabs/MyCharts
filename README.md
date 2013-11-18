# MyCharts 

MyCharts is a Visualforce package that works on both desktop browsers
and the new Salesforce1 mobile experience. MyCharts provides a simple
and dynamic interface for creating charts that can be easily modified
and shared with others in your organization. MyCharts is not intended
to be a replacement for the existing charts and dashboards in
Salesforce. Instead, MyCharts has three properties that complement the
existing built-in charts.


* MyCharts is built with Google Charts, so users who are more familiar
  with Google Charts might prefer it, especially since it includes a
  couple of chart types that are not part of the built-in Salesforce
  charts.

* MyCharts is written with the latest HTML5 capabilities, which allows
  chart creation to be quicker and more flexible.  

* MyCharts is built on top of the latest version of the Salesforce
  Analytics API and can serve as a reference implementation, showing
  how customers can extend the Salesforce platform with their own
  customized solutions.

The existing charts within Salesforce have several capabilities that
MyCharts lacks, so if you critically depend on any of these features,
you’ll want to continue to use the built-in charts alone or in
combination with MyCharts. For example, the built-in charts can be
embedded in other locations and can also be composed into a larger
dashboard of charts that can be updated in bulk.

> Note: Throughout this document we refer to MyCharts by the single
> name of "MyCharts." However, this package has occasionally been
> referred to as "My Insights." As a result, you might occasionally
> see "My Insights" or "Show Insights" in the interface.

## Building from Source

If you intend to work from the source code of MyCharts, you'll need to
take at least four steps to build and deploy to a salesforce org via the
metadata APIs.

1. Make sure that you have ant installed.
2. Install the ant extensions in this repository's deps/ directory.
3. Fill in an org profile in the build.properties file.
4. Run "ant -Dprofile=USERNAME" where USERNAME is the profile that you defined in the previous step.


## Installation and Administration

MyCharts can be installed from the salesforce.com AppExchange via
[http://bit.ly/mycharts](http://bit.ly/mycharts) as an unmanaged package.  Managed versions
of the package will be available later.  In either case, the
installation process is automatic. Before installing the MyCharts
package, ensure that your instance of Salesforce satisfies the
following two requirements.

* Salesforce version 186 or greater, to support the new Salesforce1
  mobile experience.

* API version 29.0.

Once the MyCharts package is installed, there are four manual steps
that an administrator can perform in order to fully activate MyCharts
within an organization.

### Security Profiles

MyCharts makes use of custom objects with custom fields. As a result,
any user who can view and create a MyCharts chart needs to be part of
a security profile that has read, write, update, and delete privileges
for the MyChart custom object. We suggest that you further specify
that all users have read access to any MyChart object, but that only
the owner of a MyChart object can delete and update a given chart. If
you update the standard user profiles to include these privileges,
then all new users will be able to use MyCharts. Or, you can create a
new profile that includes the required privileges and selectively add
users to the new profile, allowing you to more selectively grant
access to MyCharts. If you simply want to experiment with or demo
MyCharts, you can run MyCharts as an administrator without needing to
create or modify security profiles.

### Enabling MyCharts in Salesforce1 Stage-left

Once MyCharts is installed, a new Visualforce tab named "MyCharts" is
automatically added to the organization. If you’d like users of
Salesforce1 to have easy access to MyCharts via the stage-left
navigation, you’ll need to manually add the tab to the mobile
configuration. From Setup, go to the new section on Mobile
Navigation. From there, you’ll see an option to add MyCharts to the
list of mobile navigation menu items. Adding the tab will immediately
enable it on Salesforce1 for all users.

### Enabling MyCharts as a Salesforce1 MDP action

Installing the MyCharts package creates a Global Action named
"MyCharts" that triggers the chart creation UI. To enable MyCharts as
an MDP action, add the MyCharts Global Action to the list of Publisher
Actions in the Publisher Layouts Setup section. One side-effect of
adding a Publisher Action is that it will also add MyCharts as a new
Chatter post type to the desktop experience.

> Note: At this time, MyCharts is not designed to be a Chatter post
> type, but there is there no way to disable the new Chatter post type
> without disabling the corresponding MDP action. As a result, we
> suggest that when you add MyCharts as a Publisher Action, place it
> in any position other than the first action. This will prevent
> MyCharts from being the default Chatter posting experience.

### Enabling MyCharts Desktop Tab

The MyCharts package contains a Visualforce tab, and you might want to
enable the tab to be accessible for all desktop users, since it’s the
easiest way to access your MyCharts charts.

## User Guide

MyCharts has a very simple user interface that is nearly identical in
the desktop and mobile versions. You access all of your MyCharts
charts by clicking on the MyCharts tab (desktop), clicking on the
stage-left icon (mobile), or by directly navigating to /apex/MyCharts
on desktop.

The charts shown initially in the MyCharts tab are static thumbnail
images. The desktop version of MyCharts has three controls per chart
that become visible by hovering over a particular chart. These
controls allow you to share, edit, or delete a chart. Clicking on a
chart in either mobile or desktop opens up a "live" version of the
chart. Live charts are no longer just images and may have some dynamic
interaction available by either hovering over or clicking on different
portions of the chart. From the live version of a chart, you can also
edit, share, or delete the chart.

### Creating Charts

When you create a chart, the first step is to pick a report that will
generate the chart's data. The report picker will show only those
reports that are in your personal custom reports folder. For demo
purposes, you’ll want to make sure that you’ve created suitable
reports in advance. Any chart that you create must be derived from a
report that was saved with summary or matrix format. Scatter charts
have the additional requirement that they have at least two numerical
values as part of the report output.

> Note: MyCharts cannot determine at run time if a report fulfills
> these requirements. As a result, it’s possible to pick a report that
> is unsuitable for making a chart, so we suggest that when giving
> demos you appropriately prune the reports that are in your personal
> folder.

### Editing Charts

When you edit a chart, you can dynamically switch between the
following chart types: horizontal and vertical bar, pie, line, area,
stepped area, scatter, or tree map. You can also edit the title of the
chart. If you need a chart to be derived from a different report than
the one it was created with, you must create a new chart.

### Sharing Charts

Charts can be shared to Chatter with the share button. When sharing,
you can specify a feed and also some text to include in the post. A
MyCharts Chatter post will contain a link to the chart. The owner of a
chart can edit the chart's properties from this link, and others can
view the chart.

