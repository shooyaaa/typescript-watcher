# typescript-watcher
On the fly typescript file watcher, auto compile and auto reload browser

Dependency ： fswatch

Modify config.js
  port : A http server will serve your static files running at this port
  src : The directory where your typescript files is, fswatch will watch it
  bin : The root of static files
  compile : Typescript output directory
Run 
  node watch.js
