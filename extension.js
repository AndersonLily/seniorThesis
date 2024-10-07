// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
/**
 * @param {vscode.ExtensionContext} context
 */


let filesToModify = [];
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

    let options = vscode.OpenDialogOptions ={
       canSelectFiles: true,
        canSelectFolders: true
    }
    vscode.window.showOpenDialog(options).then(value => {
        if (value == undefined){
            console.log("Inside console log");
        }else{
            console.log(value[0]);
        }
        
    });
}

function hello_world_command(){
    // The code you place here will be executed every time your command is executed

		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from Spider!');
}


/*
function handleTextEditorChange(event) {
    if(isStorytellerCurrentlyActive) {
        //path to the file that is being edited
        const filePath = event.document.fileName;

        //if the file being edited is in the tracked st project
        if(filePath.startsWith(vscode.workspace.workspaceFolders[0].uri.fsPath) === true) {
            //go through each of the changes in this change event (there can 
            //be more than one if there are multiple cursors)
            for(let i = 0;i < event.contentChanges.length;i++) {
                //get the change object
                const change = event.contentChanges[i];
    
                //if no text has been added, then this is a delete
                if(change.text.length === 0) {
                    //get some data about the delete
                    const numCharactersDeleted = change.rangeLength;
                    const deleteTextStartLine = change.range.start.line;
                    const deleteTextStartColumn = change.range.start.character;
        
                    //record the deletion of text
                    projectManager.handleDeletedText(filePath, deleteTextStartLine, deleteTextStartColumn, numCharactersDeleted);
                } else { //new text has been added in this change, this is an insert
                    //if there was some text that was selected and replaced 
                    //(deleted and then added)
                    if(change.rangeLength > 0) {
                        //get some data about the delete
                        const numCharactersDeleted = change.rangeLength;
                        const deleteTextStartLine = change.range.start.line;
                        const deleteTextStartColumn = change.range.start.character;

                        //first delete the selected code (insert of new text to follow)
                        projectManager.handleDeletedText(filePath, deleteTextStartLine, deleteTextStartColumn, numCharactersDeleted);
                    } 
        
                    //get some data about the insert
                    const newText = change.text;
                    const newTextStartLine = change.range.start.line;
                    const newTextStartColumn = change.range.start.character;
        
                    //a set of all the event ids from a copy/cut
                    let pastedInsertEventIds = [];

                    //if this was a paste
                    if(clipboardData.activePaste) { 
                        //if the new text is exactly the same as what was on our clipboard
                        if(newText === clipboardData.text) {
                            //store the pasted event ids
                            pastedInsertEventIds = clipboardData.eventIds;
                        } else { //this is a paste but it doesn't match the last storyteller copy/cut (pasted from another source)
                            //create an array of strings with 'other' for the paste event ids to signify a paste from outside the editor
                            pastedInsertEventIds = newText.split('').map(() => 'other');

                            //clear out any old data
                            clipboardData.text = '';
                            clipboardData.eventIds = [];
                        }

                        //we handled the most current paste, set this back to false
                        clipboardData.activePaste = false;
                    }
                    //record the insertion of new text
                    projectManager.handleInsertedText(filePath, newText, newTextStartLine, newTextStartColumn, pastedInsertEventIds);
                }
            }
        }
    }
}
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
