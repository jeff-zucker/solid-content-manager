```turtle

# Data Source
@
:News a ui:FeedSelector; ui:label "News Feeds";                                                              
  ui:dataSource <feeds.ttl#TopTopic>.                                                                        

# Data Source is a Solid Container                                                                           
#                                                                                                            
:Desktop a ui:ContainerManager; ui:label "Desktop Pod";                                                      
  ui:dataSource <http://localhost:3101/>.                                                                    

# Data Source is an HTML page                                                                                
#                                                                                                            
:Home a ui:Link; ui:label "Home";                                                                            
  ui:dataSource <home.html>.                                                                                 
                                                                                                             
# Data Source is hard-coded content                                                                          
#                                                                                                            
:Home a ui:Content; ui:label "Future Feature";                                                               
  ui:dataSource "Not yet implemented!".                                                                      
                                                                                                             
# Data Source is hard-coded javascript                                                                       
#                                                                                                            
:Home a ui:Script; ui:label "Future Feature";                                                                
  ui:dataSource "()=>{...}".       

```

<style>
  h1 {
    font-size:100%;
    padding-bottom:0;
    margin-bottom:0;
  }
  a {
    text-decoration:none;
    color:black;
  }
  ul { 
    margin:0;
    padding-top:0; 
    list-style:none;
    padding:0.5em; 
  }
  li { 
    padding:0.15em; 
  }
</style>
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

