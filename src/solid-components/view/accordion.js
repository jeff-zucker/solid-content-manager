export class Accordion {
  async render(solidUI,json) {
    const parts = json.parts;
    const accordion = solidUI.createElement('DIV','accordion');
    if(!parts || !parts.length) return accordion;
    for(let row of parts){
       let item = solidUI.createElement( 'DIV' );
       let rowhead = solidUI.createElement( 'DIV','' );
       let name = solidUI.createElement('SPAN','',row.label || row.topic) ;
       name.style.display="table-cell";
       name.style.width="100%";
       rowhead.appendChild(name);
       let caret = solidUI.createElement('SPAN','caret-down','\u2304') ;       
       caret.style.display="table-cell";
       caret.textAlign="right";
       rowhead.appendChild(caret);
       rowhead.style.backgroundColor = json.unselBackground;
       rowhead.style.color = json.unselColor;
       rowhead.style.padding="0.75em";
       rowhead.style.border="1px solid grey";
       rowhead.style.cursor = "pointer";
       let rowContent = solidUI.createElement( 'DIV');
       if(row.content) rowContent.innerHTML = row.content;
       else {
        console.log(json)
        for(let i=0;i<row.linkLabel.length;i++){
          let label = row.linkLabel[i];
          let link = row.linkUrl[i];
          let button=solidUI.createElement('BUTTON','',label);
          button.setAttribute('data-link',link) ;
          button.style.width="100%";
          button.style.border="none";
          button.style.background="transparent";
          button.style.marginBottom="0.25em";
          button.style.cursor="pointer";
          button.onclick = (e) => {
            showByClass(e);
          }
          rowContent.appendChild(button);
        }
       }
       rowContent.style.padding="0.75em";
       rowContent.style.border="1px solid grey";
       rowContent.style.borderTop="none"; 
       rowContent.style.display = "none";
       rowhead.onclick = (e)=>{
         let showing = rowContent.style.display === "block" ;
         let items = accordion.children;
         for(let i of items) {
           i.children[1].style.display="none";
         }
         rowContent.style.display = showing ?"none" :"block";
       }
       rowContent.style.backgroundColor = json.background;
       rowContent.style.color = json.color;
       item.appendChild(rowhead);
       item.appendChild(rowContent);
       item.style.marginBottom = "1em";
       accordion.appendChild(item);
    }
    solidUI.simulateClick(accordion.querySelector('DIV DIV DIV'))
    return await solidUI.initInternal(accordion);  
  }
}
