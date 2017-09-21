## Overview

This repository contains a Node.js script which is designed to run in the Webtask.io environment. The script sources data by pulling a Craig's List RSS feed of free couches in the Portland, OR area, and then parsing that feed for individual listings. The individual listing pages are then pulled simlutaneously to cut down on processing time. These pages contain the relevant latitude and longitude for the listing, which is then mapped back to the listing data. Finally, this information is displayed in the browser using the Google Map Javascript API. A marker is placed on the map for each location, and an information window appears when you click each marker, showing the listing title and a link to the original listing page.

The task currently cannot be dynamically configured to accept arbitrary locations, but this is mostly due to the difficulty in mapping postal codes and addresses to available Craig's List markets. Another option would be to allow the user to select from a list of known CL markets. Adding data sources from various other listing sites would obviously also increase usability. Finally, many free couches are not "on the curb", so camping them out would prove challenging. There would have to be significant image and/or content analysis performed on a case-by-case basis to overcome this limitation and only show couches which were readily available.

To view:

https://wt-dee4317587704831da3ab295262380bc-0.run.webtask.io/who-needs-airbnb
