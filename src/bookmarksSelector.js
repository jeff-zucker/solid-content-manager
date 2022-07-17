import {CU} from    '../../solid-ui-components/src/utils.js';

export  async function bookmarksSelector(topTopic,wanted,targetSelector){

  const u = new CU();
  const bookm = UI.rdf.Namespace("http://www.w3.org/2002/01/bookmark#");
  const rdfs = UI.rdf.Namespace("http://www.w3.org/2000/01/rdf-schema#");
  let targetElement = document.body;

  await u.crossLoad(topTopic);
  topTopic = UI.rdf.sym(topTopic);
  let topicNodes = UI.store.each(null,bookm('subTopicOf'),topTopic)
  let topics = [];
  for(let n of topicNodes){
     topics.push([n.value, UI.store.any(n,rdfs('label')).value]);
  }
  let onchange = async(e)=>{await collectionSelector(e)};
  let topicSelector = u.makeSelector(topics,onchange,wanted);
  topicSelector.id="topicSelector";
  if(targetSelector){
    targetElement = document.querySelector(targetSelector);
    targetElement.innerHTML="";
    targetElement.appendChild(topicSelector);
    targetElement.appendChild( u.newElement('SELECT','collectionSelector') );
    targetElement.appendChild( u.newElement('DIV','itemSelector') );
    await collectionSelector(topics[0][0],wanted);
  }
  return topicSelector;

  async function collectionSelector(topTopic,wanted){
    if(typeof topTopic === "string") topTopic = UI.rdf.sym(topTopic);
    await u.crossLoad(topTopic);
    let topicNodes = UI.store.each(null,bookm('hasTopic'),topTopic)
    let collections = [];
    for(let n of topicNodes){
       let href = UI.store.any(n,bookm('recalls')).value;
       let label = UI.store.any(n,rdfs('label')).value;
       collections.push([href,label]);
    }
    let onchange = async(e)=>{await itemSelector(e)};
    let colSelector = await u.makeSelector(collections,onchange,wanted,null,7);
    colSelector.id="collectionSelector";
    let el = targetElement.querySelector('#collectionSelector');
    el.size = colSelector.size;
    el.innerHTML = colSelector.innerHTML;
    await itemSelector(collections[0][0],wanted);
  }

  async function itemSelector(topTopic,wanted,targetElement){
return;
    if(typeof topTopic === "string") topTopic = UI.rdf.sym(topTopic);
    await u.crossLoad(topTopic);
    let topicNodes = UI.store.each(null,bookm('hasTopic'),topTopic)
    let collections = [];
    for(let n of topicNodes){
       let href = UI.store.any(n,bookm('recalls')).value;
       let label = UI.store.any(n,rdfs('label')).value;
       collections.push([href,label]);
    }
    let onchange = async(e)=>{await itemSelector(e)};
    let colSelector = await u.makeSelector(collections,onchange,wanted,targetSelector);
    let el = document.querySelector(targetSelector);
    el.appendChild(colSelector);
    await itemSelector(collections[0][0],wanted,targetSelector);
  }

}
