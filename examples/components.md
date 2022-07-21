# Solid-UI-Components Ontology Overview

## Components are expressed in this form :
```
   [] a ui:Component; ui:dataSource [a ui:DataSource].
```
The ui:Component is a possibly interactive UI feature that includes subclasses such as ui:Menu, ui:Table, etc.  Each component can be linked to a DataSource. 

## ui:DataSource

A ui:DataSource is anything that can be used to retrieve data including :

**DataSource is an rdf:Collection**
```
    [] a ui:Menu; ui:dataSource ( :option1 :option2 ).
```
**DataSource is a ui:SparqlQuery**
```
    [] ui:Table; ui:dataSource [a ui:SparqlQuery; ui:endpoint <e1>, <e2>; ui:query "SELECT ?foo ..."].
```
**DataSource is an RDF subject**
```
    [] a ui:ConceptTree; ui:dataSource <bookmarks.ttl#TopTopic>.
```

**DataSource is a ui:Link**
```
    [] a ui:Link; ui:href <foo.html>.     # fetch
    [] a ui:Link; ui:transform <bar.md>.  # fetch & modify based on content-type
    [] a ui:Link; ui:solidOS <baz.ttl>.   # fetch & display with outliner.GotoSubject()

    Note : `ui:needsProxy` and `ui:hasIframeBlocker` are booleans & can be used with any ui:Link
```

**DataSource is a ui:HardCoded**
```
    [] a ui:Hardcoded; ui:content "some <b>bold</b> content".
    [] a ui:Hardcoded; ui:script "()=>{...}".
```

  * [] a ui:FeedSelector; ui:dataSource <feed.ttl#TopTopic>.
  * [] a ui:ContainerManager ui:href </someContainer/>.


----------------------------------------------
:this
 a ui:DataTemplate
 ui:endpoint <>
 ui:query "..."
 ui:template "".

:this
 a ui:CustomTemplate
 ui:value "some cool ${stuff} ...".
 ui:dataSource <>.



# My Content

  * [Local CSS]()
  * [Solid Community NSS]()
  * [Solid Community NSS test]()
  * [Solidweb CSS]()
  * [Inrupt ESS]()

# Shared Content

  * [Glossary]()

# Public Content

  * [News]()
  * [Culture]()


### Classes to be added to the UI Ontology

  * ui:Template

  * subclasses of ui:Template

    * ui:Accordion
    * ui:AccordionMenu
    * ui:App
    * ui:BookmarkTree
    * ui:CustomTemplate (a string with variables to be interpolated)
    * ui:Feed
    * ui:FeedList
    * ui:FeedReader
    * ui:FolderManager
    * ui:Menu
    * ui:ModalButton
    * ui:MusicPlayer
    * ui:PageDefinition (a project definition e.g. the glossary page)
    * ui:Slideshow

  * subclasses of ui:DataSource

    * ui:SparqlQuery
    * ui:Link
    * ui:Feed
  rdfs:Collection
  ldp:Resource

## ui:DataSource

A `ui:DataSource` is the RDF data that gets either displayed directly or put into a ui:Template.

DataSorces include

* ui:SparqlQuery - results of a query
* ui:Link - text output of fetch of a link
* ui:SolidOSLink - output of making an outliner.GotoSubject() call
* ui:Feed - output of fetch of an rss/atom feed
* ui:Bookmark
* 

[] a ui:Link; ui:href: <foo.html>.  # content of foo.html
[] a ui:Feed; ui:href: <foo.rss>.   # list of items in foo.rss feed

[] a ui:Feed ;
  ui:label "TechRadar" ;
  ui:href 

* ui:DataSource is an RDF subject

```turtle
  # show a tree-menu to a list of resources in an RDF source (bookmarks, feeds, etc.)
  #
  [] a ui:TopicTree; ui:dataSource <cultureBrowser.ttl#TopTopic> .
```
* ui:DataSource is a Container

```turtle
  # show a ui for managing a container
  #
  [] a ui:ContainerManager; ui:dataSource </path/containerToAccess/>.
```

All solid-ui components take this form
```
  [] a ui:Component ui:dataSource [a ui:DataSource] .
```
A ui:Component is an interactive display vehcilce for data and includes subclasses like ui:Menu, ui:Accordion, ui:ContainerManager, etc.

A ui:DataSource includes subclasses such as ui:SparqlQuery and ui:Feed, and can also be an rdfs:Collection, an HTML page, an RDF subject, or anything that provides data.

:MyMenu a ui:Menu; ui:dataSource (
  [a ui:SparqlQuery; ui:label "Solid Specs"; ui:endpoint <http://solidprojectorg/TR/>; ui:query "SELECT ?bar ..." ] ]
) .

# Data Source 
:News a ui:FeedSelector; ui:label "News Feeds";
  ui:dataSource <feeds.ttl#TopTopic>.




  

### A `ui:Component` is composed of a `ui:Template` and a `ui:DataSource`


  [a ui:Component] ui:dataSource [a ui:DataSource] .


```turtle
:myTable a ui:Table;  ui:datasource [a ui:SparqlQuery] .

:myForm a ui:Form;  ui:dataSource [a ldp:RDFSource] . 

:myModal a ui:ModalButton; ui:dataSource ( buttonLabel modalContent ) .

```


### Subclasses of `ui:Compenent` include

