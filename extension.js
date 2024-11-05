// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const fs = require('fs');
const fs2 = require('fs').promises;

const BUG_TYPE = {
    FUNCTIONAL: 0,
    PREPROCESSOR: 1,
    SYNTAX: 2,
    MOD: 3
};

const tokenTypes = ['asm', 'double', 'new',	'switch', 'auto', 'else',
    'operator',	'template', 'break', 'enum', 'private',	'this', 'case',
    'extern','protected', 'throw', 'catch',	'float', 'public', 'try',
    'char',	'for',	'register',	'typedef',
    'class',	'friend', 'return',	'union',
    'const', 'goto',	'short',	'unsigned',
    'continue',	'if',	'signed',	'virtual',
    'default',	'inline',	'sizeof',	'void',
    'delete' ,'int',	'static',	'volatile', 
    'do',	'long',	'struct',	'while' ];
 

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
/**
 * @param {vscode.ExtensionContext} context
 */


let filesToModify = [];
let current_directory = null;
let spiderFileSelectStatusBarItem = null;
let secondFileStatusBarItem = null;

/* Since in the package.json has the activationEvents that contains
 * "onStartUpFinished" this function will run then, that is why all of the
 * commands included are registered here as well as calling the startup_command.
 */
function activate(context) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
    context.subscriptions.push(vscode.commands.registerCommand('spider.startup', startup_command));
    context.subscriptions.push(vscode.commands.registerCommand('spider.collectFiles', collectFiles_command));
	context.subscriptions.push(vscode.commands.registerCommand('spider.helloWorld', hello_world_command));
    context.subscriptions.push(vscode.commands.registerCommand('spider.createDirectory', create_directory_command));
    context.subscriptions.push(vscode.commands.registerCommand('spider.openPreviousDirectory', open_previous_directory_command));
    context.subscriptions.push(vscode.commands.registerCommand('spider.ReadandBugFiles', bug_files_command));
  //  context.subscriptions.push(vscode.commands.registerCommand('spider.createDirectory', // function :)));

    
   vscode.commands.executeCommand('spider.startup');
}

function startup_command(){
    console.log('startup_command');

    let new_directory = 'Create a new Spider directory'
    let old_directory = 'Open a old Spider directory'

    vscode.window.showInformationMessage('What do you want to do today?', new_directory, old_directory).then(selection => {
        if (selection === new_directory) {
            // TO DO: add icon to this from the vscode style guidelines either this is a bug to "bug" for a file to show the collection needs to happen
                    updateSpiderStatusBar('Spider - Add files', 'Select files that you want to search for bugs in', 'spider.collectFiles');
            }
        else if (selection === old_directory){
            updateSpiderStatusBar('Spider - Open Directory', 'Select the directory that contains the files you want to search for bugs in', 'spider.openPreviousDirectory');
         }
        });
}

function collectFiles_command(){
    console.log('collectFiles_command');
    // According to the vscode api on linux and windows a open dialog cannot
    // be both file selector and folder selecter, since I am prompting the user for
    // a file only that can select is set to true.
    let options = vscode.OpenDialogOptions ={
       canSelectFiles: true
    }
    vscode.window.showOpenDialog(options).then(value => {
        if (value == undefined){
            console.log("Issue with opening a file selector");
            // Have a "THROW" for this issue Maybe?
        }else{
            //filtering out anything that isn't a .h .cpp or .c
            let startOfType = (value.at(0).path).lastIndexOf('.')
            let fileType = value.at(0).path.slice(startOfType, value.at(0).path.length)

            if(fileType === ".c" || fileType === ".cpp" || fileType === ".h"){
            filesToModify.push(value.at(0))
            get_new_folder_name()
            updateSecondStatusBar('Create directory now', 'When you have collected all the files you want to bug select this button to collect them into the same directory', 'spider.createDirectory', true);
            }
        }
    });
  
}

//If this is called then the current directory will be set to what is generated.
function get_new_folder_name(){
// Have this folder title be Spider (date genrated) files inside
// get the path to the current direcory and generate the name :)

const today = new Date();
const yyyy = today.getFullYear();
const mm = today.getMonth() + 1; 
const  dd = today.getDate();

const formattedToday = dd + '-' + mm + '-' + yyyy;

// TODO: the fs.path needs to be altered to not have double slashes :)
current_directory = vscode.workspace.workspaceFolders[0].uri.fsPath + "/" + "Spider-" + formattedToday;
}


async function create_directory_command() {

    dirPath = current_directory

    let extra_slash = (current_directory).indexOf('C:')

    if(extra_slash != 0 && extra_slash != -1){
        current_directory = current_directory.slice(extra_slash, current_directory.length)
    }

    if (dirPath != null){
    try {
        await fs2.mkdir(dirPath, {recursive: true });

        for(let count_of_files = 0; count_of_files < filesToModify.length; count_of_files++){
           // By using COPYFILE_EXCL, the operation will fail if destination.txt exists.
            try {
                const file_name = (filesToModify[count_of_files].fsPath).split('\\').pop().split('/').pop();
                let individual_Path = dirPath + "\\" + file_name;
            
                await fs2.copyFile(filesToModify[count_of_files].fsPath, individual_Path);
                //console.log('source.txt was copied to destination.txt');
                updateSecondStatusBar('Create directory now', 'When you have collected all the files you want to bug select this button to collect them into the same directory', 'spider.createDirectory', false);
            }catch {
                console.error('The file could not be copied');
            }
        } 

        console.log('Directory created');
    } catch (err) {
        console.error('An error occurred:', err);
    }}
    else {
        console.log('ERROR: Tried to create a folder with a null path')
    }
}

function open_previous_directory_command(){
    let options = vscode.OpenDialogOptions = {
        canSelectFolders: true
    }

     vscode.window.showOpenDialog(options).then(value => {
         if (value == undefined){
             console.log("Problem in open previous directory command");
             // Have a "THROW" for this issue 
         }else{
             //filtering out anything that isn't a .h .cpp or .c
             
             let findSpider = (value.at(0).path).indexOf('Spider-')
             //let specificSpiderDi = value.at(0).path.slice(startOfType, value.at(0).path.length)

             if(findSpider != -1){
                current_directory = value.at(0).path
                let extra_slash = (current_directory).indexOf('C:')

                if(extra_slash != 0 && extra_slash != -1){
                    current_directory = current_directory.slice(extra_slash, current_directory.length)
                }
             }
         }
     });
}

 function get_files_from_spider_directory(dir){

    for(let remove_counter = filesToModify.length ; remove_counter >= 0; remove_counter--){
        filesToModify.pop();
        console.log("removed the last thing in filestomodify")
    }

    let newFile;
    //try {
        const files = fs.readdirSync(dir);
        for (const file of files){
          newFile = dir + "/" + file
          filesToModify.push(newFile.toString());
        }
}


function getCodeLength(data_string){
    let codeCounter = 0;
    let inSingleComment = false;
    let inMultiComment = false;
    let possibleToBeinComment = true;

    for(let i = 0; i < data_string.length; i++){
        if(possibleToBeinComment){
            if(i != 0 && data_string.at(i) === '/' && data_string.at(i-1) === '/' && !inMultiComment){
                inSingleComment = true;
            }
            else if(i != 0 && data_string.at(i) === '*' && data_string.at(i-1) === '/' && !inSingleComment){
                inMultiComment = true;
            }
            else if(i != 0 && data_string.at(i) === '/' && data_string.at(i-1) === '*' && inMultiComment){
                inMultiComment = false;
            }
            else if(i != 0 && data_string.at(i) === '\n' && inSingleComment){
                inSingleComment = false;
            }
            else if(i != 0 && data_string.at(i) === '\"'){
                possibleToBeinComment = false;
                codeCounter++;
            }
            else if(!inSingleComment && !inMultiComment){
                codeCounter++;
            }
        }
        else{
            if(data_string.at(i) === '\"'){
                possibleToBeinComment = true;
            }
            codeCounter++;
        }
    }
    return codeCounter;
}

function functional_bug(data_string ,path){
// change the data stirng 
let successful = false;
let return_string = data_string;



return{
    didBug: successful,
    bugstring: return_string
}
}

function preprocesser_bug(data_string, path){
  //  console.log("here");
let successful = false;
let return_string;
// (Math.floor(Math.random()* 2))%2 == 0)
if (true){
// Removing a preprocessor command
let definesPresent = [];
//let each_character_code = [];

// Finding the location of all the preprocessor commands
for(let counter = 0; counter < data_string.length; counter++){
    // individal = []
    // individal.push(data_string.at(counter))
    // individal.push((data_string.at(counter)).charCodeAt())
    //each_character_code.push(individal);
    if(data_string.at(counter) == '#'){
        definesPresent.push(counter);
    }
}

//console.log(each_character_code);

//console.log(definesPresent);
 let toRemove = (Math.floor(Math.random()* definesPresent.length));
// console.log(toRemove);
//console.log(definesPresent.at(toRemove));
 
 // Here I have to look for " " or <> or define lines
 let nextSpace = data_string.indexOf( "\r\n", definesPresent.at(toRemove));
 //console.log(nextSpace);
 

let substring = data_string.substr(definesPresent.at(toRemove), (nextSpace - definesPresent.at(toRemove)));

console.log(substring)
return_string = data_string.replace(substring, "");

if(return_string.search(substring) == -1){
    successful = true;
}

// Choose a random postion in the defines present array
}else 
{
    return_string = "#define NULL = 1\n" + return_string;

    didBug = true;
 // Adding a preprocessor command   

}

return{
    didBug: successful,
    bugstring: return_string
}
}

function syntax_bug(data_string, path){
    let successful = false;
    let return_string = data_string;

    /*
    
    */

    // let text_document = vscode.workspace.openTextDocument(vscode.Uri.file(path)).then( doc => {
    //     console.log(doc.getText());
    // });
    // // GOing to attempt to use the api of syntax highlighting to get all the syntax from the file, prefroable 
    // // as it is already a string...

    // const tokenTypes = ['class', 'interface', 'enum', 'function', 'variable'];
    // const tokenModifiers = ['declaration', 'documentation'];
    // const legend = new vscode.SemanticTokensLegend(tokenTypes, tokenModifiers);
 

return{
    didBug: successful,
    bugstring: return_string
}
}


// SOMETHING FUN ABOUT javascript and node.js is that it will do things out of order so make sure that all of the information
// that I am printing out ot the console make sense and if it need to be assiciated with a file that I am printing that
// information all in hte same line or right together >:]
function bug(data_string, path){
   // console.log(data_string);
    console.log(path);

    let return_string = data_string;

    //  NOTE THIS IS WHAT IS DETREMINING HOW MANY BUGS ARE IN THE CODE IF THE NUBMER NEEDS TO BE ALTERED LOOK HERE first
    let randomNumberBug = (Math.floor(Math.random()* 10) + 1) ;// Since random is 0 inclusive 
    let numOfBugs = (getCodeLength(data_string) % randomNumberBug); 

  //  console.log(numOfBugs);

        //Choose what type of bug randomly
        //Choose what subjection of bug to insert
        //Insert the bug into the code by removing or inserting code
        // If the insertion is successful subtract the numOfBugs by 1
    let consecutive_unsuccesful_bugs = 0;
    // TEMPORARY RESERT OF NUMOF BUGS TO BE 1 always 
    numOfBugs = 1;
    while(numOfBugs > 0){
    
        let bug = (Math.floor(Math.random()* 10) % BUG_TYPE.MOD);
        let successful_bug;
    
       // if(bug === BUG_TYPE.FUNCTIONAL){
       //     successful_bug = functional_bug(return_string, path);

       // }
       // else if(bug === BUG_TYPE.PREPROCESSOR){
            successful_bug = preprocesser_bug(return_string, path);
            return_string = successful_bug.bugstring;
       // } 
       // else if(bug === BUG_TYPE.SYNTAX){
        //    successful_bug = syntax_bug(return_string, path);
      //  }
    //successful_bug.didBug
        if(successful_bug.didBug){
            numOfBugs--;
        }
        else if(consecutive_unsuccesful_bugs == 2){
            break;
        }
        else{
            consecutive_unsuccesful_bugs++;
        }
    }

    // ONCE OUT OF THE WHILE LOOP HERE I WOULD WRITE TO THE FILE :) 
    // OR RETURN THE string and write where the bug funtion was called :)
   console.log(return_string);

    console.log(" ");
}


function bug_files_command(){

    get_files_from_spider_directory(current_directory);

// Learned this here https://youtu.be/yQBw8skBdZU?si=bh5_ADuWAWO99xOI
    for(let i = 0; i < filesToModify.length ; i++){
        console.log("tring to read a file");
        fs.readFile(filesToModify.at(i), (err,data)=>{
          //  if(err) throw err;
                bug(data.toString(), filesToModify.at(i))
        })
    }  
    
    // for(let count_of_files = 0; count_of_files < filesToModify.length; count_of_files++){
    //     console.log("The file to modify is " + filesToModify.at(i));
    // }

}


// This is also being used a the test function for writing code that is ued for debugging but I ma not sure if it 
// Will esixt in the final product.
function hello_world_command(){
    // The code you place here will be executed every time your command is executed

         //get_new_folder_name()
        //  create_folder(current_directory)

      
          //vscode.window.showInformationMessage('Hello VS code!', true);

          //vscode.window.showInputBox();
         // vscode.window.showQuickPick("Create new directory", "Open existing directory", "More information about Spider");
}

/*
What I think I might do is create a copy of of all the files that are collected and put a copy of them
all into the smae folder that this extention runs and will delete if asked, that way the original files are never changed
but all their code is accessable to have, and then there could be a command called copy the bugged file over that copies it to 
the users file only if htey want to. This means that all of hte files can be put in the same file and displayed in the file tree 
at the same time which would be ideal.
*/
function updateSpiderStatusBar(text, tooltip, command) {
    //if the status bar has not been created yet
    if(spiderFileSelectStatusBarItem === null) {
        //add a item to the status bar
        spiderFileSelectStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 10);    
        spiderFileSelectStatusBarItem.text = text;
        spiderFileSelectStatusBarItem.tooltip = tooltip;
        spiderFileSelectStatusBarItem.command = command;
        spiderFileSelectStatusBarItem.show();
    } else { //the status bar has been created
        //update the existing status bar
        spiderFileSelectStatusBarItem.text = text;
        spiderFileSelectStatusBarItem.tooltip = tooltip;
        spiderFileSelectStatusBarItem.command = command;
    }
}

function updateSecondStatusBar(text, tooltip, command, show) {
    //if the status bar has not been created yet
    if (show === true){
        if(secondFileStatusBarItem === null) {
        //add a item to the status bar
        secondFileStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 10);    
        secondFileStatusBarItem.text = text;
        secondFileStatusBarItem.tooltip = tooltip;
        secondFileStatusBarItem.command = command;
        secondFileStatusBarItem.show();
    } else { //the status bar has been created
        //update the existing status bar
        secondFileStatusBarItem.text = text;
        secondFileStatusBarItem.tooltip = tooltip;
        secondFileStatusBarItem.command = command;
    }
    }else{
        if(secondFileStatusBarItem != null) {
        secondFileStatusBarItem.hide();
        } 
    }
}

// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}
