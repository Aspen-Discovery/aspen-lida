import { Box } from '@gluestack-ui/themed';
import { useColorModeValue } from '../../themes/theme';
import React from 'react';
import { Platform } from 'react-native';
import { AppleMaps, GoogleMaps } from 'expo-maps';

const mapStyle = [
     {
          featureType: 'poi.business',
          stylers: [
               {
                    visibility: 'off',
               },
          ],
     },
     {
          featureType: 'poi.medical',
          stylers: [
               {
                    visibility: 'off',
               },
          ],
     },
     {
          featureType: 'poi.park',
          elementType: 'labels.text',
          stylers: [
               {
                    visibility: 'off',
               },
          ],
     },
];
const mapStyleDark = [
     {
          elementType: 'geometry',
          stylers: [
               {
                    color: '#242f3e',
               },
          ],
     },
     {
          elementType: 'labels.text.fill',
          stylers: [
               {
                    color: '#746855',
               },
          ],
     },
     {
          elementType: 'labels.text.stroke',
          stylers: [
               {
                    color: '#242f3e',
               },
          ],
     },
     {
          featureType: 'administrative.locality',
          elementType: 'labels.text.fill',
          stylers: [
               {
                    color: '#d59563',
               },
          ],
     },
     {
          featureType: 'poi',
          elementType: 'labels.text.fill',
          stylers: [
               {
                    color: '#d59563',
               },
          ],
     },
     {
          featureType: 'poi.business',
          stylers: [
               {
                    visibility: 'off',
               },
          ],
     },
     {
          featureType: 'poi.medical',
          stylers: [
               {
                    visibility: 'off',
               },
          ],
     },
     {
          featureType: 'poi.park',
          elementType: 'geometry',
          stylers: [
               {
                    color: '#263c3f',
               },
          ],
     },
     {
          featureType: 'poi.park',
          elementType: 'labels.text',
          stylers: [
               {
                    visibility: 'off',
               },
          ],
     },
     {
          featureType: 'poi.park',
          elementType: 'labels.text.fill',
          stylers: [
               {
                    color: '#6b9a76',
               },
          ],
     },
     {
          featureType: 'road',
          elementType: 'geometry',
          stylers: [
               {
                    color: '#38414e',
               },
          ],
     },
     {
          featureType: 'road',
          elementType: 'geometry.stroke',
          stylers: [
               {
                    color: '#212a37',
               },
          ],
     },
     {
          featureType: 'road',
          elementType: 'labels.text.fill',
          stylers: [
               {
                    color: '#9ca5b3',
               },
          ],
     },
     {
          featureType: 'road.highway',
          elementType: 'geometry',
          stylers: [
               {
                    color: '#746855',
               },
          ],
     },
     {
          featureType: 'road.highway',
          elementType: 'geometry.stroke',
          stylers: [
               {
                    color: '#1f2835',
               },
          ],
     },
     {
          featureType: 'road.highway',
          elementType: 'labels.text.fill',
          stylers: [
               {
                    color: '#f3d19c',
               },
          ],
     },
     {
          featureType: 'transit',
          elementType: 'geometry',
          stylers: [
               {
                    color: '#2f3948',
               },
          ],
     },
     {
          featureType: 'transit.station',
          elementType: 'labels.text.fill',
          stylers: [
               {
                    color: '#d59563',
               },
          ],
     },
     {
          featureType: 'water',
          elementType: 'geometry',
          stylers: [
               {
                    color: '#17263c',
               },
          ],
     },
     {
          featureType: 'water',
          elementType: 'labels.text.fill',
          stylers: [
               {
                    color: '#515c6d',
               },
          ],
     },
     {
          featureType: 'water',
          elementType: 'labels.text.stroke',
          stylers: [
               {
                    color: '#17263c',
               },
          ],
     },
];

const DisplayMap = (data) => {
     const location = data?.data ?? {};

     const mapColorMode = useColorModeValue('light', 'dark');
     const mapRef = React.useRef(null);
     const hasCoordinates =
          Number.isFinite(location.latitude) &&
          Number.isFinite(location.longitude) &&
          location.latitude !== 0 &&
          location.longitude !== 0;

     if (!hasCoordinates) {
          return null;
     }

     const coordinates = {
          latitude: location.latitude,
          longitude: location.longitude,
     };

     const cameraPosition = {
          coordinates,
          zoom: 16,
     };

     if (Platform.OS === 'ios') {
          return (
               <Box pt={2} pb={2}>
                    <AppleMaps.View
                         ref={mapRef}
                         style={{ height: 180, width: '100%' }}
                         cameraPosition={cameraPosition}
                         colorScheme={
                              mapColorMode === 'light'
                                   ? AppleMaps.MapColorScheme.LIGHT
                                   : AppleMaps.MapColorScheme.DARK
                         }
                         markers={[
                              {
                                   id: 'library',
                                   coordinates,
                                   title: location.displayName,
                              },
                         ]}
                         properties={{
                              pointsOfInterest: {
                                   including: [],
                              },
                         }}
                    />
               </Box>
          );
     }

     return (
          <Box pt={2} pb={2}>
               <GoogleMaps.View
                    ref={mapRef}
                    style={{ height: 180, width: '100%' }}
                    cameraPosition={cameraPosition}
                    colorScheme={
                         mapColorMode === 'light' ? GoogleMaps.MapColorScheme.LIGHT : GoogleMaps.MapColorScheme.DARK
                    }
                    markers={[
                         {
                              id: 'library',
                              coordinates,
                              title: location.displayName,
                              snippet: location.address,
                              showCallout: true,
                              anchor: { x: 0.5, y: 0.25 },
                         },
                    ]}
                    uiSettings={{
                         scrollGesturesEnabled: false,
                         zoomGesturesEnabled: false,
                         rotationGesturesEnabled: false,
                         tiltGesturesEnabled: false,
                    }}
                    properties={{
                         mapStyleOptions: {
                              json: JSON.stringify(mapColorMode === 'light' ? mapStyle : mapStyleDark),
                         },
                    }}
               />
          </Box>
     );

};

export default DisplayMap;
