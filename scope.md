GData Redesign 2020 Scoping
===========================

Goal
----
Create a user interface in modern, supportable technologies that is backed by a flexible, updatable back end.

Major Elements
--------------
1. Redesign the back end from a wide, inflexible format with many tables to a longer, more flexible format.
2. Use Electron to reproduce the functionality of the current Access front end with the new data format.

Non-Elements
------------
No new features that do not currently exist in GData.  This includes:
  * Reports
  * Data versioning
  * Integration with external systems
  * Additional upload/export formats

Tasks
-----

### Element 1 - Backend
1. (8) Build new tables based on Water Quality Research Journal paper (Plana et. al., 2019)
2. (8) Create data conversion scripts to load old data to new format.

### Element 2 - Frontend
#### Viewing Data
1. (6) Get dummy app with database connection running in Electron (complete)
2. (16) Build REST API for querying data by site, parameter, and date, with an option for daily values
3. (4) Build REST API for querying site information (metadata?)
4. (8) Design layout (ongoing, subject to revision)
5. (16) Summaries of data by site, parameter, and water year; one line each with mean, low, high, and count
6. (24) Duplicate the water year report, with daily values, summary stats, and a graph
7. (4) Download queried raw data to CSV
8. (2) Download queried daily data to CSV
9. (8) View site details

#### Loading Data
10. (8) Load a CSV to a temp table for review
11. (6) Create/update/delete a new metadata record
12. (6) Create/update/delete a new parameter record
13. (6) Create/update/delete a new method record
14. (6) Create/update/delete a new site
15. (6) Create/update/delete a new sampling point
16. (6) Create/update/delete a new equipment record
17. (6) Create/update/delete a new project
18. (12) Review screen for file load and associating or creating metadata - single parameter
