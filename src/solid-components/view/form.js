import * as u from '../utils.js';
/*
  form.render()   // define options via Javascript parameters
  form.fromUrl()  // define options via ui:Component file
  form.fromMem()  // define options via a ui:Component string

*/
export class Form {

  /**
   * @param {String}      form - the URL of the form definition document
   * @param {String}      formSubject - the data for the form
   * @param {String}      [formString] - a string form definition
   * @param {HTMLElement} [dom=document] - DOM container to hold form
   * @param {Boolean}     [forceReload] - empty store before loading
   * @param {String}      [formResultDocument] - place to store form results
   * @param {Function}    [script] - Javascript to execute on form change
   * @returns an HTML DIV element containing the form
   */
  async fromURL(url){
    let node = UI.rdf.sym(url);
    await UI.fetcher.load(node);
    return await this.render({
                form : url,
         formSubject : u.getProperty(node,'ui:formSubject'),
              script : u.getProperty(node,'ui:script'),
      resultDocument : u.getProperty(node,'ui:formResultDocument'),
    });
  }
  async render(o){
    const dom = o.dom || document;
    const container = document.createElement("DIV");
    container.classList.add('uic-form');
    let form = UI.rdf.sym(o.form);
    let subject;
    if(o.formSubject) subject = UI.rdf.sym(o.formSubject) ;
    if(o.formString){
      UI.rdf.parse(string,UI.store,o.form,'text/turtle');
    }
    else await UI.store.fetcher.load(o.form);
    if(!subject){
       let fSubj = UI.rdf.sym('http://www.w3.org/ns/ui#formSubject');
       subject = UI.store.any(form,fSubj)
    }
    if(o.forceReload){ 
      if(subject && subject.doc) UI.store.removeDocument(subject.doc());
    }
    if(subject) await UI.store.fetcher.load(subject.doc());
    else {
      container.innerHTML="ERROR : Could not load form subject "
      return container;
    }
    const title = document.createElement("H2");
    let doc = o.formResultDocument;
    if(subject && !doc && subject.doc) doc = subject.doc();
    const script = o.script || function(){};
    try {
      UI.widgets.appendForm(dom, container, {}, subject, form, doc, script);
    }
    catch(e){
       container.innerHTML = "FORM ERROR:"+e;
    }  
    return container;
  }

}

/* OLD
  async render(solidUI,options){
    const container = document.createElement("DIV",'uic-form');
    const dom = window.document;
    const form = await solidUI.loadUnlessLoaded(options.form);
    await solidUI.loadUnlessLoaded(options.formSubject);
    const subject = await solidUI.loadUnlessLoaded(options.formSubject);
    if(!subject) return console.log("ERROR : Couldn not load form subject ",options.formSubject)
    let doc = options.formResultDocument;
    if(!doc && subject.doc) doc = subject.doc();
    const script = options.script || function(){};
    try {
      UI.widgets.appendForm(dom, container, {}, subject, form, doc, script);
    }
    catch(e){return console.log(e)}  
    if(options.onchange) {
      const vals = container.querySelectorAll('.formFieldValue button');
      for(let v of vals){
        v.onclick = "alert(3)";
      }
    }
    return container;
  }

*/
