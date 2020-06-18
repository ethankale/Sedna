Alqwu
=====
A water database for high-rate data, individual data points, and everything in between.

Getting Started
---------------
To install the application:

1: Get access to an MSSQL instance (2012 or above).  You can install the Express version on your desktop from https://www.microsoft.com/en-us/sql-server/sql-server-downloads.
2: Run the database install/setup script, included in this repo at ./src/sql/schema.sql.
3: Set up a user with read/write access on the newly created database.  This users can't use the windows login; it has to use a password login.
4: Download the program (currently, grab it from Github, I guess).
5: Open the program, immediate go to settings, and put in the SQL Server info for the DB and the user you created.

That should do it.  Most likely issue is with the user; make sure the user you create & use has permission to read, write, and delete for every table in the database.

Development
-----------
You'll need Node 12 and NPM 6.  Pull the project into a new directory with git.  `npm install` to install all the dependencies. `npm run build` to execute webpack and bundle the javascript code.  `npm start` to run the Electron app. `npm make` to create an Electron project.

Some SQL Server caveats:

1: Make sure you enable TCP connections for the server in the SQL Server Configuration Manager.  See https://stackoverflow.com/questions/2388042/connect-to-sql-server-2008-with-tcp-ip.
2: You have to enable SQL Server logins; by default it only allows Windows connections.

### Naming Conventions
#### SQL
Tables are singular.  So are columns.  Pascal casing (all first words upper, no spaces or underscores).  Many-to-many tables include the names of both tables.  Dtm means datetime.  IDs get unique names (unique throughout the database).  Foreign key columns have the exact same name as the primary key of the joined table.  No prefixes or suffixes on tables or columns.  The following suffixes on other things:
* _v View (with the main TableName in front, of course)
* _fk Foreign Key (the constraint name, not the column name)
* _cac Cache
* _seg Segment
* _tr Transaction (stored proc or function)
* _fn Function (non-transactional), etc.

Mostly this is cribbed from https://stackoverflow.com/questions/4702728/relational-table-naming-convention/4703155#4703155.
By convention, names are varchar(100), and descriptions are varchar(255).

#### Vue
VueJS components are translated into valid HTML and back.  HTML doesn't recognize cases, so CamelCase is not great.  For components we've been using just flatvariablenames, which isn't great.  Kebob-case is a possible alternative, but not how we're doing things right now.