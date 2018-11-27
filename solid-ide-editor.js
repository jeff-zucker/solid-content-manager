/* VERSION 0.1.2
**     2018-11-27
*/
var SolidIdeEditor = function(elementID) {
    this.name="zeditor"
    this.ed = ace.edit(elementID,{
        maxLines:24,
        minLines:14,
    });
    this.getContents = function (){
        return this.ed.getValue()
    };
    this.setContents = function (contents){
        this.ed.setValue(contents)
    };
    this.setSize = function (lines){
        this.ed.setOption("maxLines",lines)
        this.ed.setOption("minLines",lines)
    };
    this.setReadOnly = function (trueOrFalse){
        this.ed.setReadOnly(trueOrFalse)
    };
    this.setModeFromType = function (type){
        if(type){
            if(type==='folder') type = 'text/turtle'
            if(type==='text/plain') type = 'text'
            if(!type.match(/(unknown|image|video|audio)/)){
                type = type.substring(type.lastIndexOf('/')+1);
                this.setMode(type)
            }
        }
    };
    this.setMode = function (mode){
        this.ed.getSession().setMode('ace/mode/'+mode);
    };
    this.setTheme = function (theme){
        this.ed.setTheme('ace/theme/'+theme);
    };
    this.setKeys = function (key_style){
        if(key_style==='zemacs'){
            key_style='emacs';
            if(!this.tweaksSet) { this.tweak_emacs()};
        }
        this.ed.setKeyboardHandler('ace/keyboard/'+key_style);
    };
    /* NOTHING BELOW HERE EXCEPTS EMACS TWEAKS
    */
this.tweak_emacs = function(){
    this.tweaksSet=true;
    this.ed.commands.addCommand({
        name: "linedown",
        bindKey: { win: "Down|Ctrl-Alt-N", mac: "Command-N" },
        exec: function(editor, args) { editor.navigateDown(args.times); },
        multiSelectAction: "forEach",
        scrollIntoView: "cursor",
        readOnly: true
    });
    this.ed.commands.addCommand({
        name: "gotoend",
        bindKey: {win:"Ctrl-Alt-K|Ctrl-End",mac:"Command-End|Command-Down"},
        exec: function(editor) { editor.navigateFileEnd(); },
        multiSelectAction: "forEach",
        readOnly: true,
        scrollIntoView: "animate",
        aceCommandGroup: "fileJump"
    });
    this.ed.commands.addCommand({
        name: "gotostart",
        bindKey: {win:"Ctrl-Alt-J|Ctrl-Home",mac:"Command-Home|Command-Up"},
        exec: function(editor) { editor.navigateFileStart(); },
        multiSelectAction: "forEach",
        readOnly: true,
        scrollIntoView: "animate",
        aceCommandGroup: "fileJump"
    });
    this.ed.commands.addCommand({
        name: "lineup",
        bindKey: { win: "Up|Ctrl-P|Ctrl-Alt-P", mac: "Command-P" },
        exec: function(editor, args) { editor.navigateUp(args.times); },
        multiSelectAction: "forEach",
        scrollIntoView: "cursor",
        readOnly: true
    });
    this.ed.commands.addCommand({
        name: "gotoline",
        bindKey: { win:"Ctrl-Alt-G", mac:"Command-G"},
        exec: function(editor, line) {
            if (typeof line !== "number")
                line = parseInt(prompt("Enter line number:"), 10);
            if (!isNaN(line)) {
                editor.gotoLine(line);
            }
        },
        readOnly: true
    });
  }/* function emacs_tweak */
  return this
};/* Zeditor */
