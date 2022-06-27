
  async renderAccordionLinks (json) {
    const results = json;
    let bgColor = "#ddd";
    const accordion = this.createElement('DIV','accordion-menu');
    accordion.classList.add('horizontal');
    if(!results || !results.length) return accordion;
    let cols  = Object.keys(results[0]);
    for(let row of results){
       let item = this.createElement( 'DIV' );
       let name = row[cols[0]];
       let rowhead = this.createElement( 'DIV','' );
       name = this.createElement('SPAN','',name) ;       
       name.style.display="table-cell";
       name.style.width="100%";
       rowhead.appendChild(name);
       let caret = this.createElement('SPAN','caret-down') ;       
       caret.style.display="table-cell";
       caret.textAlign="right";
       rowhead.appendChild(caret);
       rowhead.style.backgroundColor = bgColor;
       rowhead.style.padding="0.75em";
       rowhead.style.border="1px solid grey";
       rowhead.style.cursor = "pointer";
       let rowContent = "";
       for(let i=1; i<cols.length; i++){
         let key = cols[i];
         let value = row[key] || "";
         rowContent += `<p><b>${key}</b> : ${value}</p>`;
       }
       rowContent = this.createElement( 'DIV',null,rowContent );
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
       item.appendChild(rowhead);
       item.appendChild(rowContent);
       item.style.marginBottom = "1em";
       accordion.appendChild(item);
    }
    return await this.initInternal(accordion);  
  }

  async renderAccordionLinks2 (json) {
    const results = json.parts;
    let bgColor = "#ddd";
    const accordion = this.createElement('DIV','accordion-menu');
    accordion.classList.add('horizontal');
    if(!results || !results.length) return accordion;
    let cols  = Object.keys(results[0]);
    for(let row of results){
       let item = this.createElement( 'DIV' );
       let name = row[cols[0]];
       let rowhead = this.createElement( 'DIV','' );
       name = this.createElement('SPAN','',name) ;       
       name.style.display="table-cell";
       name.style.width="100%";
       rowhead.appendChild(name);
       let caret = this.createElement('SPAN','caret-down') ;       
       caret.style.display="table-cell";
       caret.textAlign="right";
       rowhead.appendChild(caret);
       rowhead.style.backgroundColor = bgColor;
       rowhead.style.padding="0.75em";
       rowhead.style.border="1px solid grey";
       rowhead.style.cursor = "pointer";
       let rowContent = "";
       for(let i=1; i<cols.length; i++){
         let key = cols[i];
         let value = row[key] || "";
         rowContent += `<p><b>${key}</b> : ${value}</p>`;
       }
       rowContent = this.createElement( 'DIV',null,rowContent );
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
       item.appendChild(rowhead);
       item.appendChild(rowContent);
       item.style.marginBottom = "1em";
       accordion.appendChild(item);
    }
    return await this.initInternal(accordion);  
  }


  /* ACCORDION MENU
  */
  async renderAccordionMenu(json){
    const results = json.parts;
//    const accordion = this.createElement('DIV','accordion-menu');
    const accordion = this.createElement('DIV','dropdown-menu');
//    accordion.classList.add('dropdown-menuhorizontal');
    const leftCol = this.createElement('DIV','left-column');
    let mid="";
    let got  = {}
    let topics = results.map((row)=>{
      if(!got[row.topic]) {
        got[row.topic]=1;
        return row.topic;
      }
    }).filter(row=>typeof row != "undefined")
    for(let topic of topics) {
      let itemElement = this.createElement('SPAN','',topic) ;
      itemElement.onclick= (e) => {
        let links = accordion.querySelectorAll('BUTTON');
        let sib = e.target.nextSibling;
        sib.style.display="block"
        let sublinks = sib.querySelectorAll('BUTTON');
        let showing = sublinks[0].style.display==='block';
        for(let link of links){
          link.style.display="none";
        }
        for(let link of sublinks){
          if(showing) link.style.display="none";
          else link.style.display="block";
        }
      }
      let contentElement = this.createElement('DIV');
      contentElement.tabindex=0;
      contentElement.onblur = ()=>{alert(3)}
      let rows=results.filter((row)=>row['topic']===topic);
      for(let row of rows){
        let button=this.createElement('BUTTON','',row.label);
        button.value = row.link ;
        button.onclick = (e) => {
          e.target.parentElement.style.display="none";
          showIframe(e.target.value,iframe);
        }
        button.style.display = "none";
        contentElement.appendChild(button);
      }
      leftCol.appendChild(itemElement)
      leftCol.appendChild(contentElement)
    }
    accordion.appendChild(leftCol);
    accordion.appendChild( iframe );
    return await this.initInternal(accordion);  
  }
