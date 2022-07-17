import {CU} from    '../../solid-ui-components/src/utils.js';
let u = new CU();

export async function makeProjectMenu(url2open,zeditor){
    url2open ||= "http://localhost:3101/s/solid-ide/examples/glossary/glossary-definition.ttl";
    url2open = decodeURI(url2open);
    zeditor = showProjectMenu(url2open,zeditor);
    await u.crossLoad(url2open);
    let project = u.getMainSubject(url2open);
    let type = u.getUItype(project);
    if(!type==="PageDefinition") return;
    let templateUrl = u.getObject(project,u.UIO('pageTemplate'));
    let template = await u.loadFile(templateUrl);
    let p = zeditor.currentProject = {
      url          : url2open,
      label        : u.getObject(project,u.UIO('label')),
      endpoint     : u.getObject(project,u.UIO('inputData')),
      inputForm    : u.getObject(project,u.UIO('inputForm')),
      outputPage   : u.getObject(project,u.UIO('outputPage')),
      components   : u.getObjects(project,u.UIO('component')),
      template : template || "",
      pageTemplate : templateUrl,
    }
    let components = "";
    for(let c of UI.store.match(project,u.UIO('component'))){
      let label = u.getObject(c.object,u.UIO('label'));
      let href = u.getObject(c.object,u.UIO('href'));
      components += `
  <button onclick="loadZeditor('${href}','both')">
    Edit ${label} template
  </button>
      `;
    };
    let menuStr = `
<p><b>${p.label}</b></p>
<div><b>Editor Tasks</b></div>
  <button class="selected" onclick="loadZeditor('${p.outputPage}','display')">
    View page as HTML
  </button>
  <button onclick="loadZeditor('${p.inputForm}','display')">
    Edit data (via form)
  </button>
  <button onclick="loadZeditor('${templateUrl}','both')">
    Edit page template
  </button>
  ${components}
<div><b>Admin Tasks</b></div>
  <button onclick="loadZeditor('${p.outputPage}','both','rdfa')">
    View page as RDF
  </button>
  <button onclick="loadZeditor('${p.endpoint}','both')">
    Edit data (raw)
  </button>
  <button onclick="loadZeditor('${p.inputForm}','both')">
    Edit form
  </button>
  <button onclick="loadZeditor('${p.url}','both')">
    Edit page definition
  </button>
  `;
  document.getElementById('project').innerHTML=menuStr;
  u.menuize('#project');
  await loadZeditor(p.outputPage,'display')
  return zeditor;

  function showProjectMenu(uri,zeditor){
    document.querySelector('#left-column').classList.add('project');
    if(zeditor.currentFile) zeditor.lastVisited = zeditor.currentFile.url
    zeditor.currentProject=uri;
    return zeditor ;
  }

}
