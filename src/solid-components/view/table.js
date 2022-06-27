export class Table {
  render(options) {
    let results = options.parts;
    if(!results || !results.length) {
      console.log("No results!");
      return document.createElement('SPAN');
    }
    if(options.sortOn) {
//      results.sort((a,b)=> a[options.sortOn] - b[options.sortOn] )
      results = results.reverse();
    }
    let table = document.createElement('TABLE');
    let columnHeaders = Object.keys(results[0]);
    let headerRow = document.createElement('TR');
    for(let c of columnHeaders){
      let cell = document.createElement('TH');
      cell.innerHTML = c;
      cell.style.border="1px solid black";
      cell.style.padding="0.5em";
      cell.style.background=options.unselBackground;
      cell.style.color=options.unselColor;
      headerRow.appendChild(cell);
    }
    table.appendChild(headerRow);
    for(let row of results){
      let rowElement = document.createElement('TR');
      for(let col of columnHeaders){
        if(options.cleanNodes){
          row[col] = row[col].replace(/.*\#/,'').replace(/.*\//,'');
        }
        let cell = document.createElement('TD');
        cell.innerHTML = row[col];
        cell.style.border="1px solid black";
        cell.style.padding="0.5em";
        cell.style.backgroundColor=options.background;
        cell.style.color=options.color;
        rowElement.appendChild(cell);
      }
      table.appendChild(rowElement);
    }
    table.style.borderCollapse="collapse";
    return table;
  }
}
// ENDS
