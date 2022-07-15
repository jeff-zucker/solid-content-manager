### A `ui:Component` is composed of a `ui:Template` and a `ui:DataSource`

```turtle
:myTable a ui:Table ;  ui:datasource [a ui:SparqlQuery] .

:myForm a ui:Form ;  ui:dataSource [a ldp:RDFSource] . 

:myModal a ui:ModalButton; ui:dataSource ( buttonLabel modalContent ) .

```
  
[a ui:Component] ui:dataSource [a ui:Datasource] .


### Subclasses of `ui:Compenent` include

  * implemented
    * `ui:Tabset`
    * `ui:Accordion`
    * `ui:ModalButton`
    * `ui:Table`
    * `ui:Form`
    * `ui:SelectorPanel`
    * `ui:PageDefinition`  (a project definition e.g. the glossary page)
    * `ui:CustomTemplate`  (a string with variables to be interpolated)

  * in progress
    * `ui:Menu`
    * `ui:AccordionMenu`
    * `ui:App`
    * `ui:FeedReader`
    * `ui:Slideshow`
    * `ui:MusicPlayer`
    * `ui:FolderManager`

### Subclasses of ui:DataSource include

  * `ui:SparqlQuery`
  * `ui:Link`
  * `ui:Feed`
  * `rdfs:Collection`
  * `ldp:RDFSource`


### Examples


  

