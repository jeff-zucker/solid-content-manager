export class Menu {

  async render( solidUI, json,element ){
    if(typeof json==='string'){
      json = await solidUI.processComponent(element,json);
    }
    let nav     = solidUI.createElement('NAV')
    if(json.orientation==="horizontal") nav.classList.add('solid-uic-dropdown-menu');
    let topUL   = document.createElement('UL')
    let mainDisplay = document.createElement('DIV')
    nav.style.background=json.unselBackground;
    nav.style.color=json.unselColor;
    mainDisplay.style.width="100%";
    mainDisplay.style.backgroundColor = json.background;
    mainDisplay.style.color = json.color;
    mainDisplay.innerHTML="";
    mainDisplay.classList.add('main');
    nav.appendChild(topUL)
    for(var i of json.parts){
      topUL.appendChild( await this.renderMenuItem(i,json,mainDisplay) )
    }
    const wrapper = solidUI.createElement('SPAN');
    nav.style.display="inline-block";
    nav.style.textAlign=json.position;
    topUL.style.textAlign=json.position;
    topUL.style.padding="0";
    wrapper.appendChild(nav);
    wrapper.appendChild(mainDisplay);
    return(wrapper);
  }

  async renderMenuItem(i,json,mainDisplay){
    if(i.menu && i.menu.type && i.menu.type === "SparqlQuery"){
      let menu = await solidUI.processComponent(null,null,i.menu);
      if(typeof menu==="object") i.parts = menu
    }
    const li = document.createElement('LI')
    const sp =  document.createElement('SPAN')
    sp.innerHTML = i.label
    li.appendChild(sp)
    li.style.cursor="pointer"
    li.style.display = "inline-block";
    li.style.padding = "0.5em";
    li.style.backgroundColor = json.unselBackground;
    li.style.color = json.unselColor;
    li.onmouseover = ()=>{
      li.style.backgroundColor = json.selBackground;
      li.style.color = json.selColor;
    } 
    li.onmouseout = ()=>{
      li.style.backgroundColor = json.unselBackground;
      li.style.color = json.unselColor;
    } 
    if(i.popout || !i.parts){
// i.target=json.target;
      /*
       *  <li class="item"><span>${i.label}</span></li>
       */
      li.classList.add('item')
      li.name = i.href
      const self = this
/*
      li.addEventListener('click',(e)=>{
        window.displayLink(e,i,mainDisplay)
      })
We can't easily override the eventListener later so use onclick instead.
*/
      li.onclick = (e)=>{
        i.href = e.target.parentElement.name;
        window.displayLink(e,i,mainDisplay)
      }
    }
    else {
      /*
        <li class="caret">
          <span class="caret" style="cursor:pointer;">${i.title}</span>
          <ul class="nested">
          </ul>
        </li>
      */
      li.classList.add('caret')
      let ul2 = document.createElement('UL')
      li.appendChild(ul2)
      ul2.classList.add('nested')     
      for(var m in i.parts){
        let newItem = i.parts[m]
        if(typeof newItem==='object') newItem.target=json.target;
        ul2.appendChild( await this.renderMenuItem(newItem,json,mainDisplay) )
      }
    }
    return li
  }
}
