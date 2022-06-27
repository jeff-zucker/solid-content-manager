const $rdf = require('rdflib');
const store = $rdf.graph();
const fetcher = $rdf.fetcher(store);
const UI = $rdf.Namespace("http://www.w3.org/ns/ui#"); 

module.exports.getComponent = async function getComponent(componentURL) {
  await fetcher.load(componentURL);
  let subject = $rdf.sym(componentURL);
  let templateURL = (store.any( subject,UI("template") ) ||{}).value;
  let dataURL = (store.any( subject,UI("dataSource") ) ||{}).value;
  let dataSourceURL = (store.any( subject,UI("dataSource")) ||{}).value;
  let data = await getDataSource(dataURL)
console.log(data);
  let template = await getTemplate(templateURL)
  template.middle = ""
  for(const row of data){
    template.middle += template.recurring.interpolate(row);
  }
  return
    template.before.interpolate(data)
    + template.middle
    + template.after.interpolate(data)
  ;
}
async function getTemplate(uri){
  let template = {};
  try {
    await fetcher.load(uri);
  }
  catch(e){console.log(e); process.exit();}
  let subject = $rdf.sym(uri);
  template.before = (store.any( subject,UI("before")) ||{}).value;
  template.recurring = (store.any(subject,UI("recurring")) ||{}).value;
  template.after = (store.any( subject,UI("after") ) ||{}).value;
  return template;
}
async function getDataSource(uri){
  let subject = $rdf.sym(uri);
  const datasource = {};
  try {
    await fetcher.load(uri);
    datasource.endpoint = (store.any( subject,UI("endpoint")) ||{}).value;
    datasource.query = (store.any( subject,UI("query")) ||{}).value;
console.log(datasource.query)
    if( !datasource.endpoint || !datasource.query ) return [];
    await fetcher.load(datasource.endpoint)
    const preparedQuery=await $rdf.SPARQLToQuery(datasource.query,false,store);
    let wanted = preparedQuery.vars.map( stm=>stm.label );
    let table = [];
    let results = store.querySync(preparedQuery);
    for(let r of results){
      let row = {};
      for(let w of wanted){
        let value = r['?'+w];
        row[w] = value ?value.value :"";
      }
      table.push(row);
    }
    table = table.sort((a,b)=>a.label > b.label ?1 :-1);
    return table
  }
  catch(e) { console.log(e); }
}
/* https://stackoverflow.com/a/41015840/15781258
 * usage :
 *   const template = 'Hello ${var1}!';
 *   const data     = { var1: 'world'};
 *   const interpolated = template.interpolate(data);
 */
String.prototype.interpolate = function(params) {
  const names = Object.keys(params);
  const vals = Object.values(params);
  return new Function(...names, `return \`${this}\`;`)(...vals);
}



/* getDatasource()
 * 
 * When called as core.getDatasource("http://example.com/foo.ttl#bar"),
 * this method will look in the file "http://example.com/foo.ttl" for a 
 * triple like the one below where ?IRI is an RDF data source and STRING
 * is a SPARQL query.  The method will return results as an array of hashes
 * e.g. [{field1:"foo",field2:"bar"},{field1:"baz",field2:"bop"}].
 *
 *    <#bar>
 *      a ui:Datasource ;
 *      ui:endpoint ?IRI ;
 *      ui:query  ?STRING .
*/
/* processComponent(ComponentURL)
 *
 * params : compenentURL should point to a statement in this format:
 *
 *   <#ComponentURL>
 *       a ui:Component ;
 *       ui:dataSource [
 *         a ui:DataSource ;
 *         ui:endpoint <?DATA_URL> ;
 *         ui:query <?SPARQL_STRING>
 *       ] ;
 *     .
 *
/* getTemplate()
 *
 * looks for [
 * 
 *   <#TempateName>
 *     a ui:Template ; 
 *     ui:before <?BEFORE_STRING> ;
 *     ui:after <?AFTER_STRING> ;
 *
*/

