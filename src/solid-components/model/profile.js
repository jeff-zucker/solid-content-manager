const $rdf = panes.UI.rdf;

const RDFS = $rdf.Namespace('http://www.w3.org/2000/01/rdf-schema#');
const FOAF = $rdf.Namespace('http://xmlns.com/foaf/0.1/');
const SOLID = $rdf.Namespace('http://www.w3.org/ns/solid/terms#');
const PIM = $rdf.Namespace('http://www.w3.org/ns/pim/space#');
const LDP = $rdf.Namespace('http://www.w3.org/ns/ldp#');
const VCARD = $rdf.Namespace('http://www.w3.org/2006/vcard/ns#');

/* loadProfile()
*/
export async function loadProfile(webId) {
  const kb = window.kb;
  const fetcher = $rdf.fetcher(kb);
  const node = $rdf.sym(webId);
  try {
    await fetcher.load(webId);
  }
  catch(e){
    console.log("Couldn't load profile : "+e);
    return {};
  }
  let extendedDocs = kb.each( webId, RDFS('seeAlso') );
  extendedDocs = extendedDocs.concat( kb.each( node, FOAF('primaryTopicOf') ) );
  for(let doc of extendedDocs){
    await fetcher.load(doc);
  }
  let me = {
    webId,
    name  : getObject(kb,webId,FOAF('name')) || getObject(kb,webId,VCARD('fn')) || getObject(kb,webId,FOAF('nick')) || webId,
    nick  : getObject(kb,webId,FOAF('nick')) || "",
    image : getObject(kb,webId,VCARD('hasPhoto')) || "",
    inbox : getObject(kb,webId,LDP('inbox')) || "",
    preferences : getObject(kb,webId,PIM('preferencesFile')) || "",
    privateTypeIndex : getObject(kb,webId,SOLID('privateTypeIndex')) || "",
    publicTypeIndex : getObject(kb,webId,SOLID('publicTypeIndex')) || "",
    storages : getObjects(kb,webId,PIM('storage')) || "",
    issuers : getObjects(kb,webId,SOLID('oidcIssuer')) || "",
  }
  return me; // I'm defective, get your money back ;-)
}

function getObject(kb,subject,predicate){
  subject = kb.sym(subject);
  let value = kb.any(subject,predicate);
  return value ?value.value :"";
}
function getObjects(kb,subject,predicate){
  subject = kb.sym(subject);
  let value = kb.each(subject,predicate);
  let results = [];
  for(let v of value){
    results.push(v ?v.value :"");
  }
  return results;
}
