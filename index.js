'use latest';

import express from 'express';
import { fromExpress } from 'webtask-tools';
const FeedParser = require('feedparser');
const request = require('request');
const cheerio = require('cheerio');
const app = express();
app.use(bodyParser.json());

/*
 * @TODO
 * es6
 * need body parser?
 * querystring postal?
 * abstract location data, google map api key?
 */

app.get('/', (req, res) => {
  
  const clRssUrl = 'http://portland.craigslist.org/search/zip?format=rss&query=couch';
  var rssReq = request( clRssUrl );
  var rssItems = [];
  var feedparser = new FeedParser();
  
  rssReq.on('response', function(res){
    var stream = this;
  
    if (res.statusCode !== 200) {
      this.emit('error', new Error('Bad status code'));
      return;
    }
    
    stream.pipe(feedparser);
  });  
  
  feedparser.on('readable', function(){
    rssItems.push( this.read() );
  }).on('end', () => {
    
    var mapItems = [];
    
    var nextItem = function( item ){
      request( item.link , ( error , response , body  ) => {
        var $body = cheerio.load( body );
        mapItems.push({
          title: item.title,
          link: item.link,
          lat: $body('#map').attr('data-latitude'),
          long: $body('#map').attr('data-longitude')          
        });
        
        if( mapItems.length == rssItems.length ) {
          
          // not all listings have available addresses
          mapItems = mapItems.filter( item => item.lat && item.long );
          
          const HTML = renderView({
            title: 'Who needs Airbnb?',
            googleMapApiKey: 'AIzaSyDYVHp-jMPdvfqX3fLjnocAoZkkKLwYvdM',
            postalCode: '97299',
            locationName: 'Portland, OR',
            mapItems: mapItems
          });
        
          res.set('Content-Type', 'text/html');
          res.status(200).send(HTML);            
        }
      });
    };
    
    rssItems = rssItems.filter( item => ( item && item.link ));
    
    rssItems.forEach( nextItem );
  });
});

module.exports = fromExpress(app);

function renderView(locals) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${locals.title}</title>
      <style type='text/css'>
        body,html {
         width: 100%;
         height: 100%;
         padding: 0;
         margin: 0;
        }
        header,main {
          display: block;
          padding: 10px;
          width: 95%;
        }
        #couch-map-container {
         width: 90%;
         height: 500px;
         background-color: #e8e8e8;
        }
      </style>
    </head>
    <body>
      <header>
        <h1>Who needs Airbnb?</h1>
        <h4>Who needs Airbnb when the world is your living room? Here's an updated map of ${locals.mapItems.length} free couches around ${locals.locationName}, fresh off the Craigslist RSS feed.</h4>
      </header>
      <main>
        <div id='couch-map-container'></div>
      </main>
      
      <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js"></script>
      <script src="https://s3.amazonaws.com/cloudbot/gmap.js"></script>
      <script>
      $(function(){
      
        var targetPostalCode = '${locals.postalCode}';
        var mapItems = ${JSON.stringify(locals.mapItems)};
        var couchMapInst = new gmap('${locals.googleMapApiKey}' , '#couch-map-container' );
        
        window.initMap = function(){
          var couchMapInfoWindow = new google.maps.InfoWindow();
          
          couchMapInst.getLatLongFromPostal( targetPostalCode , function( latLong ){
            couchMapInst.loadMap( latLong.location , { zoom: 11 } );
            $.each( mapItems , function( index , mapItem ){
            
              mapItem.position = new google.maps.LatLng({ lat: parseFloat( mapItem.lat ) , lng: parseFloat( mapItem.long ) });  
              var marker = couchMapInst.addMarker( mapItem );              
              
              marker.addListener('click', function() {
                couchMapInfoWindow.close();
                couchMapInfoWindow.setContent(""
                  + "<div class='info-window'>"
                  + "  <h4>" + this.title + "</h5>"
                  + "  <a href='"+this.link+"' target='_blank' href='"+ this.link +"'>" + this.link + "</a>"
                  + "</div>");
                  
                couchMapInfoWindow.open(couchMapInst, this);
              });              
            });
          });
        }
      });
      </script>
    </body>
    </html>
  `;
}
