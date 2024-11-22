# spider README

Spider is a vscode extention that aims to teach people how to look for bugs in their code. Many programmers aim to learn how to program by getting everything right the first time they write it, but lots of learning cam come from faliure. But if the thought of looking for bugs that you put in the code youself sounds mortifying or boring Spider will do it for you!

## Features

Upon using Spider you will be prompted if you want to create a new Spider directory on your computer or open a previous Spider Directory. 

You then can use the command spider.bug which will add
a random amount of bugs to all the files in the directory that you have chosen.

These bugs can range from a syntax error like a missing semi-colon to a functional bug like an instnace of a variable you declared being deleted from the code, to the preprocessor directives being changed!

> Tip: If you want to know where the bug that were generated are in your newly bugged code make sure that you made the directory that session so that the extention still have the file paths to the original file.


## Commands included

command: spider.startup - This command will prompt the text box that asks you if you want to create or open a spider directory

command: spider.collectFiles - If buttons aren't your style you can use hte collect files command to add files to a collection this way before you make the directory.

command: spider.createDirectory - Creates a directory on your machine called Spider-Month-Day-Year-Min

command: spider.openPreviousDirectory - Allows you to open a previous spider directory.

command: spider.ReadandBugFiles - Bugs the files in the current spider directory, a random number of bugs that can be a syntax, function, or preprocesser.
  
command: spider.ReadandBugFilesSyntax -  Bugs the files in the current spider directory, a random number of bugs that can only be syntax.

command: spider.ReadandBugFilesFunctional - Bugs the files in the current spider directory, a random number of bugs that can only be functional.
    
command: spider.ReadandBugFilesPreprocessor - Bugs the files in the current spider directory, a random number of bugs that can only be preprocessor.
     
command: spider.Reveal_bugs - This command can only be used if you have made the directory this session, but will reveal the areas where the bugs were inserted into the code.
    

## Known Issues

This extention was built with a windows operating systen in mind.

The reveal bugs currently does not support if a Spider diectory wasn't created in hte current session.

The reveal bugs also will add to many bugs were added here currently this is in progress to fix.

## Release Notes

### 1.0.0

Initial release of Spider 11/21/2024, This launched the extention with the MVP capability needed for my senior thesis.

**Enjoy!**
