# Graph Visualizer Start Guide

## Start mit Docker

Bitte stellen Sie als erstes sicher, dass Docker gestartet ist und keine anderen Container laufen.

### Image bauen

Mit einem Terminal in den App-Ordner navigieren und den folgenden Befehl ausführen:

`docker build --no-cache -t graph-visualizer .`

### Container Start

Nach dem erfolgreichen Build den folgenden Befehl ausführen:

`docker run -p 8080:80 --name graph-visualizer-container graph-visualizer`

### Connect

Die Seite ist nun unter `http://localhost:8080/` erreichbar.

