// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const fs = require('fs').promises;

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
/**
 * @param {vscode.ExtensionContext} context
 */


let filesToModify = [];
let files_to_bug = null;
let spiderFileSelectStatusBarItem = null;

/* Since in the package.json has the activationEvents that contains
 * "onStartUpFinished" this function will run then, that is why all of the
 * commands included are registered here as well as calling the startup_command.
 */
function activate(context) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
    context.subscriptions.push(vscode.commands.registerCommand('spider.startup', startup_command));
    context.subscriptions.push(vscode.commands.registerCommand('spider.collectFiles', collectFiles_command));
	context.subscriptions.push(vscode.commands.registerCommand('spider.helloWorld', hello_world_command));

    
   vscode.commands.executeCommand('spider.startup');
}

function startup_command(){
    console.log('startup_command');
    // TO DO: add icon to this from the vscode style guidelines either this is a bug to "bug" for a file to show the collection needs to happen
    updateSpiderStatusBar('Spider Start', 'Select files that you want to search for bugs in', 'spider.collectFiles');
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
            console.log("Inside console log");
            // Have a "THROW" for this issue 
        }else{
            filesToModify.push(value.at(0));
        }
    });

   // console.log((get_new_folder_name()))
   // console.log(vscode.workspace.workspaceFolders[0].uri.fsPath)
    
}

// NEED TO ADD A CASE FOR IF TTHERE IS NO OPEN WORKSPACE FOLDER :)
function get_new_folder_name(){

// Have this folder title be Spider (date genrated) files inside
// get the path to the current direcory and generate the name :)

const today = new Date();
const yyyy = today.getFullYear();
const mm = today.getMonth() + 1; 
const  dd = today.getDate();

const formattedToday = dd + '-' + mm + '-' + yyyy;

return vscode.workspace.workspaceFolders[0].uri.fsPath + "\\" + "Spider-" + formattedToday;
}

async function create_folder(dirPath) {
    try {
        await fs.mkdir(dirPath, { recursive: true });

        for(let count_of_files = 0; count_of_files < filesToModify.length; count_of_files++){
           // By using COPYFILE_EXCL, the operation will fail if destination.txt exists.
            try {
                const file_name = (filesToModify[count_of_files].fsPath).split('\\').pop().split('/').pop();
                let individual_Path = dirPath + "\\" + file_name;
            
               await fs.copyFile(filesToModify[count_of_files].fsPath, individual_Path);
                console.log('source.txt was copied to destination.txt');
            }catch {
                console.error('The file could not be copied');
            }
        } 
        console.log('Directory created');
    } catch (err) {
        console.error('An error occurred:', err);
    }
}

// THIS is also being used a the test function for writing code that is ued for debugging but I ma not sure if it 
// Will esixt in the final product.
function hello_world_command(){
    // The code you place here will be executed every time your command is executed

		// Display a message box to the user
		/*vscode.window.showInformationMessage('Hello World from Spider!');

        //Lets change the file pather into a uri and than use the command vscode.open
        // to display al the files 
        for (let i = 0; i < filesToModify.length; i++) {
           console.log(filesToModify[i]);
           vscode.commands.executeCommand('vscode.open', filesToModify[i]);

           console.log(i);
           console.log("opened it");
           //figure out how to navagate to the next window so all can be opened simultainouly :)
          }  
          */
          create_folder((get_new_folder_name()))
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

// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}
