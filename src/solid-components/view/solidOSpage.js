export class solidOSpage {
  render(json){
    let tabulator = document.getElementById('suicTabulator')
    if(!window.outliner) {
      tabulator.style= `
        display: none; /* Hidden by default */
        position: fixed; /* Stay in place */
        z-index: 1; /* Sit on top */
        left: 0;
        top: 10vh;
        height: 90vh; /* Full height */
        width: 100%; /* Full width */
        overflow: auto; /* Enable scroll if needed */
        background-color: rgb(0,0,0); /* Fallback color */
        background-color: rgba(0,0,0,0.2); /* Black w/ opacity */
      `
      window.outliner = panes.getOutliner(document);
    }
    window.outliner.GotoSubject(window.kb.sym(url),true,undefined,true);    
  }
}
