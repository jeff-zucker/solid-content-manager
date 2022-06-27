/*
 *  myFeed = new Feed(solidUI,feedUri)
 *  

proxy
href || link
displayType
standAlone
label
  selBackground
  selColor
  height
  width

 */

export class Feed {

  async fetchAndParse(feedUri,proxy){

    // fetch feed URI & parse into a Dom structure
    //
    feedUri = (proxy||"")+encodeURI( feedUri );

    let response = await fetch( feedUri )
    let feedContent = await response.text();
    const domParser = new window.DOMParser();
    let feedDom = domParser.parseFromString(feedContent, "text/xml")

    // find items (RSS) or entries (Atom)
    //
    let items = feedDom.querySelectorAll("item") || null;
    items = items.length<1 ?feedDom.querySelectorAll("entry") :items;

    // parse items
    //
    let parsedItems=[];
    items.forEach( el => {

      // find item link, account for specific kinds of quirks
      //
      let link = el.querySelector("link").innerHTML;
      // vox
      if(!link) link = el.querySelector('link').getAttribute('href');
      // reddit
      if(!link || link.match(/ /)){
        link = el.querySelector('content').innerHTML.replace(/.*\[link\]/ ,'').replace(/a href="/,'').replace(/"&gt;.*/,'').replace(/.*&lt;/,'');
      }
      // engadget
      if(!link.match(/^http/)) link = link.replace(/.*\[CDATA\[/,'');

      // always use https, not http
      link = link.replace(/^http:/,'https:');

      // get the title
      let title = el.querySelector("title").innerHTML;
      title = title.replace(/^\<\!\[CDATA\[/,'');
      title = title.replace(/\]\].*\>/,'').trim();

      parsedItems.push({title,link});
    });
    return parsedItems;
  }  // END OF fetchAndParse()


  async render(solidUI,json){
    let items = "";
    let externalLinkIcon = UI.icons.iconBase+`/noun_189137.svg`;
    externalLinkIcon = `<img src="${externalLinkIcon}" style="width:1em;height:1em;display:inline-block; padding-left:0.4em;opacity:0.5">`;
    for(let i of await this.fetchAndParse((json.href||json.link),json.proxy)){
      if(json.displayTarget==="window"){
/*
        items += `
          <li about="${i.link}" typeof="rss:item">
            <a href="${i.link}" target="_BLANK" property="rss:title">
              ${i.title}
            </a>
          </li>
        `;
*/
      }
      else {
        items += `
          <li about="${i.link}" typeof="rss:item" style="display:none;background:green;border:1px solid grey;">
            <a href="${json.proxy+i.link}" property="rss:title" style="background:#999;display:inline-block">
               ${i.title}
            </a>
            <a href="${i.link}" class="skipMunge" target="_BLANK" class="external">${externalLinkIcon}</a>
          </li>
        `;
      }
    }
    const wrapper = document.createElement('DIV');
    wrapper.property = "xmlns:rss";
    wrapper.content = "http://purl.org/rss/1.0/";
    if(json.standAlone) {
    wrapper.innerHTML = `
        <div about="${json.href}" typeof="rss:channel">
          <b property="rss:title">${json.label}</b>
          <ul typeof="rss:items" style="display:table">
            ${items}
          </ul>
        </div>
    `;

    wrapper.querySelector('B').style=`padding:1em;padding-right:0;background:${json.selBackground};color:${json.selColor};border:1px solid grey;width:100%;display:inline-block`;
    }
    else {
    wrapper.innerHTML = `
        <div about="${json.href}" typeof="rss:channel">
<!--          <div property="title" style="background:#d0d0d0;padding:1em;">${json.label}</div>-->
          <ul typeof="rss:items" style="display:table">
            ${items}
          </ul>
        </div>
    `;
    wrapper.querySelector('UL').style=`padding:0;padding-left:0;list-style:none;margin-top:0;width:100%;`;
    }
    wrapper.querySelector('UL').style=`padding:0;border:1px solid grey;list-style:none;margin-top:0;width:100%;height:${json.height};overflow-y:auto;`;
    let anchors = wrapper.querySelectorAll('A');
    for(let anchor of anchors){
      anchor.style="text-decoration:none;"
    }
    let listItems = wrapper.querySelectorAll('LI');
    for(let li of listItems){
      li.style="padding:0.5em;border-bottom:1px solid grey";
    }
    if(json.width) wrapper.style.width = json.width;
    return wrapper;
  }
}
