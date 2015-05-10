# UK General Election 2015 Data

The results of the 2015 UK General Election are finally in and have revealed an unpredicted 12-seat Conservative majority, placing them almost 100 seats ahead of the Labour party.


This Node.js application scrapes the data from each of the 650 constituencies from the BBC News election website and produces data files containing each candidate, including:
* the constituency that they campaigned in;
* the party that they represented (or other);
* the candidate’s name;
* the number of votes for the candidate;
* the percentage share of the total votes in the constituency;
* and the percentage change in the number of votes for the candidate (or party if a new candidate is standing for an existing party).


The data takes the same order as the BBC news website - ordered first by constituency alphabetically, followed by the number of votes that each candidate received in the constituency.


The application exports the data in two formats:
* a JSON file - data.json
* a CSV file - data.csv


Please check the [usage guide](https://github.com/robfarr/UK-General-Election-2015-Data/wiki/Usage-Guide) for help using this application.


Note: You should check that you have the necessary rights before you share any files exported by this application. 