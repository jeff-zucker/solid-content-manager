import * as user from  './user.js';
// DataSources
import {Feed} from './model/rss.js';
import {Sparql} from './model/sparql.js';
// Templates
import {Accordion} from './view/accordion.js';
import {App} from './view/app.js';
import {Form} from './view/form.js';
import {Menu} from './view/menu.js';
import {Modal} from './view/modal.js';
import {SelectorPanel} from './view/selectorPanel.js';
import {Table} from './view/table.js';
import {Tabs} from './view/tabs.js';


const sparql = new Sparql();
const proxy = "https://solidcommunity.net/proxy?uri=";
const $rdf = panes.UI.rdf;
const kb = window.kb = $rdf.graph();
window.outliner = panes.getOutliner(document);
let fetcher;
const skos = $rdf.Namespace('http://www.w3.org/2004/02/skos/core#');
const ui = $rdf.Namespace('http://www.w3.org/ns/ui#');
const rdf=$rdf.Namespace('http://www.w3.org/1999/02/22-rdf-syntax-ns#');

class SolidUIcomponent {

  constructor(){
  }

  async init(){

    // fetcher = this.makeLSfetcher(UI); // see drafts/in-browser-fetcher.js
    let all = document.querySelectorAll('[data-solid_ui_component]')
    all= all.length>0 ?all : document.querySelectorAll('[data-suic]')
    for(let element of all) {
      const content = await this.processComponent(element);
      if(content) element.appendChild( content );
    }
  }

  async initInternal(containingElement){
    let all = containingElement.querySelectorAll('[data-solid_ui_component]')
    all= all.length>0 ?all : document.querySelectorAll('[data-suic]')
    for(let element of all) {
      const content = await this.processComponent(element);
      element.appendChild( content );
    }
    return containingElement;
  }

  async processComponent(element,subject,json){
    if(!json){    
      if(!subject && element && element.dataset) subject = await this.loadUnlessLoaded(element.dataset.solid_ui_component);
      if(!subject) return null;
      json = await this.getComponentHash(subject)
    }
    json ||= subject;
    if(!json) {console.log("No ComponentHASH ",subject); return;}
    // default color,orientation,position
    json = this.getDefaults(json);

//    if(json.type.match(/Link/)){
//      return displayLink(json)
//    }

    // DATASOURCE
    let dataSource = typeof json.dataSource==="string" ?await this.getComponentHash(json.dataSource) : json.dataSource ;
    if(dataSource && dataSource.type==='SparqlQuery') {
      let endpoint = dataSource.endpoint;
      let query = dataSource.query;
      json.parts = await this.sparqlQuery(endpoint,query,json);
      if(json.type==='SparqlQuery') return json.parts;
    }
    if(json.type==='SparqlQuery') {
      json.parts = await this.sparqlQuery(json.endpoint,json.query,json);
      if(json.type==='SparqlQuery') return json.parts;
    }
    if(json.type==='AnchorList') {
      for(let l of json.content.split(/\n/) ){

      }
    }
    if(json.parts && json.groupOn){
      json.parts = sparql.flatten(json.parts,json.groupOn)
      console.log(json.groupOn,json.parts)
    }
    if(json.type==='App'){
      return await (new App()).render(this,json);
    }
    else if(json.type && json.type.match(/Link/)){
      return await window.displayLink(element,json,element);
    }
    else if(json.type==='Menu'){
      return await (new Menu()).render(this,json,element);
    }
    else if(json.type==='Feed'&&(json.href||json.link)){
      return await (new Feed()).render(this,json);
    }
    else if(json.type==='SelectorPanel'){
      let panel = new SelectorPanel();
      let d = this.setDefaults(json);
      return await panel.render(json);
    }
    else if(json.type==='ModalButton'){
      return await (new Modal()).render(this,json)
    }
    else if(json.type==='Accordion'){
      return await (new Accordion()).render(this,json)
    }
    else if(json.type==='FormComponent'){
      return await (new Form()).render(this,json)
    }
    else if(json.type==='Tabset'){
      return await (new Tabs).render(this,json)
    }
    let contentWrapper = document.createElement('DIV');
    let results,before,after,content,label;

// RECORD
    if(json.type==='Record') {
      label = this.getValue( dataSource, ui('label') );
      content = this.getValue( dataSource, ui('content') );
      results = {label,content} ;
    }

results = results || json.parts;  
this.log('Parts for Component',results);
// TEMPLATE
    let template = json.template;
    if(!template){
      return results;
    }
    if(template.groupOn) {
      results = sparql.flatten(results,template.groupOn)
    }   
    
      if(template=="AccordionMenu"){
        let compo = await this.runBuiltIn(template,results);
        if(compo) contentWrapper.appendChild(compo);
        return contentWrapper;
      }
      if(template=="Table"){
        let compo = await (new Table()).render(json);
        if(compo) contentWrapper.appendChild(compo);
        return contentWrapper;
      }
      if(template=="ModalButton"){
        let compo = await this.makeMmodal(json.label,json.content);
        if(compo) contentWrapper.appendChild(compo);
        return contentWrapper;
      }
      let recurring;
// let template = json.template.value ?json.template.value :json.template ;

/*
      let isBuiltIn = template.match(/^https:\/\/www.w3.org\/ns\/ui#/) ;
      if( isBuiltIn ) {
        if(template.match(/ModalButton/)) {
          results = await this.makeModalButton(label,content);
        }
        else if( template.match(/DropdownMenu/ || dataSourceType==="App") ){
            let m = new Menu();
            let results = await m.render(subject,contentWrapper)
            // console.log(results)
        }
        else {
          results = await this.runBuiltIn(template,results);
        }
        if(results) contentWrapper.appendChild(results);
      }
*/
        if(typeof template=="string") {
          template = await this.getComponentHash(template);
        }
        recurring = template.recurring;
        before = template.before;
        after = template.after;
//        recurring = recurring || template;
        let body = this.fillTemplate(recurring,results);
        contentWrapper.innerHTML = (before||"") + body + (after||"");

/*
      if( dataSourceType.match(/Menu/) ) {
        for(let menuItem of contentWrapper.children){
          menuItem.addEventListener('click',(event)=>this.menu(event));
        }
      }
*/
      return contentWrapper ;
    
  }
  async getComponentHash(subject,hash){
    subject = await this.loadUnlessLoaded(subject);
    if(!subject) return null;
    let predicatePhrases = kb.match(subject,null,null);
    if(subject.doc){
      let thisdoc = kb.match(null,null,null,subject.doc())
    }
    hash = hash || {}
    for(let p of predicatePhrases){
      let pred = p.predicate.value.replace(/http:\/\/www.w3.org\/1999\/02\/22-rdf-syntax-ns#/,'').replace(/http:\/\/www.w3.org\/ns\/ui#/,'');
      let obj = p.object;
	if(obj.termType==="BlankNode"){
        obj = await this.getComponentHash(obj);
        if(!hash[pred])  hash[pred] = obj;
        else if(typeof hash[pred] !='ARRAY') hash[pred] = [obj]
        else hash[pred].push(obj);
      }
      else if(obj.termType==="Collection"){
        obj = obj.elements;
        for(let uri of obj){
          let component = await this.getComponentHash(uri,{});
          if(!hash[pred])  hash[pred] = [component];
          else hash[pred].push(component);
        }
      }
      else {
        obj = obj.value.replace(/^http:\/\/www.w3.org\/ns\/ui#/,'');
        if(!hash[pred])  hash[pred] = obj;
        else if(typeof hash[pred] !='ARRAY') hash[pred] = [obj]
        else hash[pred].push(obj);
      }
      if(hash[pred].length==1) hash[pred]=hash[pred][0];
    }
    return hash ;
  }
  log(...args){
    if(typeof DEBUG!="undefined") console.log(args);
  }
  setStyle(element,styles){
    for(let s of Object.keys(styles)){
      element.style[s]=styles[s];
    }
  }


/*-----------
  SPARQL
----------*/
  async sparqlQuery(endpoint,queryString,json){
    if(typeof Comunica !="undefined")
      return await sparql.comunicaQuery(endpoint,queryString,json);
    else   
      return await sparql.rdflibQuery(solidUI,kb,endpoint,queryString,json);  
  }


/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  DISPLAY METHODS
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */

getDefaults(json){
  if(typeof json=="string") json = this.processComponent('',json)
  json.height ||= this.height;
  json.width ||= this.width;
  json.proxy ||= this.proxy || proxy;
  json.background ||= this.background || "#f6f6f6";
  json.color ||= this.color || "#000";
  json.selBackground ||= this.selBackground || "#559";
  json.selColor ||= this.selColor || "#fff";
  json.unselBackground ||= this.unselBackground || "transparent" // "#e0e0e0";
  json.unselColor ||= this.unselColor || "#000";
  json.orientation ||= this.orientation || "horizontal";
  json.position ||= this.position || "left";
  this.proxy = json.proxy
  return(json);
}
setDefaults(json){
  if(typeof json=="string") json = this.processComponent('',json)
  this.background = json.background;
  this.color = json.color;
  this.selBackground = json.selBackground;
  this.selColor = json.selColor;
  this.unselBackground = json.unselBackground;
  this.unselColor = json.unselColor;
  this.orientation = json.orientation;
  this.position = json.position
  this.proxy = json.proxy
  return(this.getDefaults(json));
}

  fillTemplate(templateStr,object){
    function fillOneTemplateRow(templateStr,object){
      for(let o of Object.keys(object) ){
        let newStuff=object[o]||" ";
        if(typeof newStuff==='object' && newStuff.length>1) newStuff = newStuff.join(", ");
        let re = new RegExp( `\\$\\{${o}\\}`, 'gi' );
        templateStr  = templateStr.replace( re, newStuff );
      }
      return templateStr;
    }
    let string = "";
    for(let r of object){
       string += fillOneTemplateRow(templateStr,r)+"\n";
    }
    return string;
  }

  runBuiltIn(json,template,results){
    if(template.match(/Table/)) return this.results2table(json,results);
    if(template.match(/Modal/)) return this.results2modal(results);
    if(template.match(/Accordion/)) return tabset(results);
    if(template.match(/DescriptionList/)) return this.results2descriptionList(results);
  }

  /* UTILITIES
  */

  diff(diffMe, diffBy){ diffMe.split(diffBy).join('') }

  simulateClick(el){
    if (el.fireEvent) {
      el.fireEvent('on' + 'click');
    } else {
      var evObj = document.createEvent('Events');
      evObj.initEvent('click', true, false);
      el.dispatchEvent(evObj);
    }
  }

  // CREATE HTML ELEMENT
  createElement(elementType,className,html,styles){
    let element = document.createElement(elementType);
    if(className) element.classList.add(className);
    if(html) element.innerHTML = html;
    if(styles){
      for(let s of styles.split(/;/)) {
        let pair = s.split(/:/)
        if(pair.length==2) 
          element.style[pair[0].trim()]=pair[1].trim();
      }
    }
    return element;
  }
  getComponentType(subject){
    if(!subject) return null;
    let uiNamespace = 'http://www.w3.org/ns/ui#';
    let type = kb.each( subject, rdf('type') ).map( (object) =>{
      object = object.value;
      if(object.match(/ns\/ui#/)) return object.replace(/.*\#/,'');
    });
    return type[0] || "";
  }

  async clearInline(){
    for(let stm of kb.match()){
      if(stm.graph.value.startsWith('inline:')) kb.remove(stm);
    }
  }

  loadFromMemory(sentUri){
    let uri = sentUri //.replace(/^inline:/,'');
    if( kb.any(null,null,null,$rdf.sym(uri)) ) return $rdf.sym(uri);
    let [eName,fragment] = uri.split(/#/);
    let eDoc = document.getElementById(eName)
    let uiString = eDoc.innerText || eDoc.value;
    uiString = uiString.trim()
    if(uiString.startsWith('\<\!\[CDATA\[')) uiString=uiString.replace(/^\<\!\[CDATA\[/,'').replace(/\]\]$/,'').replace(/~~/g,'#');
    try {
      $rdf.parse(  uiString, kb, uri, "text/turtle" ); 
      return($rdf.sym(uri));
    }
    catch(e) { console.log(e) }
  }

  async  loadUnlessLoaded(uri){
    try {
      if(!uri) return;
      if(uri && uri.termType && uri.termType==="BlankNode") return uri;
      uri = typeof uri==="object" ?uri.uri :uri;
      if(uri.startsWith('inline')) return this.loadFromMemory(uri);
      if(!uri.startsWith('http')&&!uri.startsWith('ls')) uri = window.location.href.replace(/\/[^\/]*$/,'/') + uri;
    const mungedUri = uri.replace(/\#[^#]*$/,'');
      let graph = $rdf.sym(mungedUri);
      if( !kb.any(null,null,null,graph) ){
        console.log("loading "+graph.uri+" ...");
        fetcher = fetcher || $rdf.fetcher(kb);
        let r = await fetcher.load(graph.uri);
        if(kb.any(null,null,null,graph)) console.log(`<${graph.uri}> loaded!`);
        else console.log(`<${graph.uri}> could not be loaded!`);
//console.log(kb.match(null,null,null,graph));
      }
      else console.log(`<${graph.uri}> already loaded!`);
      return $rdf.sym(uri);
    }
    catch(e) { console.log(e); return $rdf.sym(uri) }
  }
   getValue(s,p,o,g) {
     let node = kb.any( s, p, o, g );
     return node ?node.value :"" 
   }
   valuesContain(s,p,o,g,wanted) {
    let nodes = kb.each( s, p, o, g );
    for(let n of nodes) {
      n = n ?n.value :"";
      if(n===wanted) return n;
    }
  }

} // END OF CLASS SolidUIcomponent

const solidUI = new SolidUIcomponent();
document.addEventListener('DOMContentLoaded',()=>{solidUI.init();});
export default solidUI;

