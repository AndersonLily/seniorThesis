# Software Requirement Specification
## Introduction 
### Purpose 
The purpose of this document is to serve as a guide to designers, developers, and testers who are responsible for the engineering of the `Spider (Working title)` project. It should give the engineers all of the information necessary to design, develop, and test the software.

### Scope
This document contains a complete description of the functionality of the `Spider (Working title)` project. It consists of use cases, functional requirements, and non-functional requirements,
which, taken together, form a complete description of the software.

### System Overview 
This document is a complete description of the software application `SPider (Working title)`. All relevant requirement information regarding the project is included in this document. `Spider (Working title)` is intended for real-world programming students to train them how to identify common areas for bugs and what they look like. This application will be a VsCode extention able to add bugs into a runnable program that will either stop the program from able to be compile or allow compliation but have bugs considered "bad practice".

### Why call it Spider?
Well, The aim of this program is to help teach programmers how to effectively catch bugs!
### Definitions 


## Use Cases

|Name| UC-1: File-Specification/Exemption |
| ----------- | ----------- |
| Summary | A user will be able to select which files this extention will "bug" and which ones it will not.|
| Rational | When programming the user may want to use the extention on select files but leave others alone because they don't want to change them. File specification and Exemption will allow a user to decide. |
| Users | All users|
| Preconditons | A user will have written or load a "runnable" program into VsCode. The user will also have the extention open|
| Basic Events  | <ol><li>A user will select to bug their program.</li><li>Then the user will be asked if they want to bug all their files.</li><li>The user indicates no.</li><li>The program responds by allowing a user to select or exempt which files to bug.</li><li>The user will indicate what files they want bugs.</li><li>The program will continue.</li></ol> |
| Alternative Paths| <ol><li>A user will select to bug their program</li><li>Then the user will be asked if they want to bug all their files.</li><li>The user indicates yes.</li><li>The program will continue.</li></ol> |
| Post Conditions | As the program continutes it will only alter files that the user indicates. The program will NOT alter files that the user didn't specify.| 

&nbsp;
&nbsp;

|Name| UC-2: Insert-Bugs|
| ----------- | ----------- |
| Summary | The user will slelect that they want to search for additonal bugs in their program and hte prgram will insert bugs.|
| Rational | This program is designed to add bugs into a files when indicated, but this should only happend when the user indicates.|
| Users | All users |
| Preconditons |  A user will have written or load a "runnable" program into VsCode and will have selected the files that they want "bugged".|
| Basic Events  | <ol><li>A user will select to bug their program.</li><li>The program will continue and insert new bugs into their code.</li></ol> |
| Alternative Paths| <ol><li>A user will select to bug their program.</li><li>The user will cancel the procedure.</li><li>The program will not insert new bugs into their code.</li></ol>|
| Post Conditions | The files that the user indicated will have at least 1 new bug across them.| 

&nbsp;
&nbsp;

|Name| UC-3: Select-bug-level|
| ----------- | ----------- |
| Summary | The user will be able to select the dificulty range of bugs. Bug range will be further defined in documentation here: ` ` |
| Rational | This tool is made for learning and for fun and will hopefully servive users of many different programming levels if they can select the difficulty of the bugs in a scaular level this can prevent it being to challanging to new programmers or to easy for experienced programmers.|
| Users | All users|
| Preconditons | Text |
| Basic Events  | <ol><li>A user will select to bug their program.</li><li>The program prompt for the difficulty level the user would like.</li><li>The user will select the difficulty </li><li>The program will continue and insert bugs into their code.</li></ol>|
| Alternative Paths| N/A |
| Post Conditions | The prgram will have set the limtations on the diffuclty level of the bugs inserted into their program.| 

&nbsp;
&nbsp;

|Name| UC-4: Remove-Bugs|
| ----------- | ----------- |
| Summary | The program will be able to remove the bugs that it inserted into the program. It will not remove any bugs it did not enter.|
| Rational | Users may decide they want the bugs added by this program to be removed without having to find them themselves. |
| Users | All users |
| Preconditons | The file the user has indicated must have had bugs added. |
| Basic Events  | <ol><li>A user will select to remove the bug(s) the program put into the users program.</li><li>The program prompt will remove the bugs it added (not removing any bugs that the user themselves has entered).</li></ol> |
| Alternative Paths| N/A |
| Post Conditions | The program will be all code that the user themselves have written  |

&nbsp;
&nbsp;

|Name| UC-5: Bug-Reveal |
| ----------- | ----------- |
| Summary | The program will be able to reveal the bugs that it inserted into the users code |
| Rational | For users who want to know what bugs they haven't or seen thye may wish to visually see where the bug is so they can investigate. This will not reveal any bugs that the user themselves wrote.|
| Users | All users |
| Preconditons | User has bugged their program. |
| Basic Events  | <ol><li>A user will select to reveal inserted bugs their program.</li><li>The program prompt the user if they want the bugs revealed .</li><li>The user will select yes </li><li>The program will visually indicate where the bugs in the code are.</li></ol> |
| Alternative Paths| <ol><li>A user will select to reveal inserted bugs their program.</li><li>The program prompt the user if they want the bugs revealed .</li><li>The user will select no </li><li>The program will not show where the bugs in the code are.</li></ol> |
| Post Conditions | The file the user is looking at will have it's inserted bugs revealed.| 



