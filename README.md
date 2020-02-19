Alqwu
=====
A water database for high-rate data, individual data points, and everything in between.

Getting Started
---------------
TBD.  No pre-compiled binaries yet.

Development
-----------
You'll need Node 12 and NPM 6.  Pull the project into a new directory with git.  `npm install` to install all the dependencies. `npm init` to run the project.  This will start an Electron project.

### Naming Conventions
#### SQL
Tables are singular.  So are columns.  Pascal casing (all first words upper, no spaces or underscores).  Many-to-many tables include the names of both tables.  Dtm means datetime.  IDs get unique names (unique throughout the database).  Foreign keys have the exact same name as the primary key of the joined table.  No prefixes or suffixes on tables or columns.  The following suffixes on other things:
* _V View (with the main TableName in front, of course)
* _fk Foreign Key (the constraint name, not the column name)
* _cac Cache
* _seg Segment
* _tr Transaction (stored proc or function)
* _fn Function (non-transactional), etc.
Mostly this is cribbed from https://stackoverflow.com/questions/4702728/relational-table-naming-convention/4703155#4703155.
By convention, names are varchar(100), and descriptions are varchar(255).