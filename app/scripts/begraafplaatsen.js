/*
 Copyright (c) 2008-2014 Zaanstad Municipality

 Published under the GPL license.
 See https://github.com/teamgeo/webapp-begraafplaatsen/raw/master/license.txt for the full text
 of the license.
*/
var geojsonBegraafplaatsen = {
    'type': 'FeatureCollection',
    'crs': {
        'type': 'name',
        'properties': {
            'name': 'urn:ogc:def:crs:EPSG::28992'
        }
    },
    'features': [{
        'type': 'Feature',
        'properties': {
            'name': 'noordster',
            'locatie': 'Begraafplaats Noordster Wormerveer',
            'latlngbounds': [
                [52.499160606098798, 4.781167963144955], //ne
                [52.498075626755359, 4.779357759265973]  //sw
                ]
        },
        'geometry': {
            'type': 'Point',
            'coordinates': [113784.796368368930416, 501385.830376138910651]
        }
    }, {
        'type': 'Feature',
        'properties': {
            'name': 'zaandijk',
            'locatie': 'Begraafplaats Zaandijk',
            'latlngbounds': [
                [52.471840015440975, 4.804831699417253], //ne
                [52.470641082928012, 4.803564893747468]  //sw
                ]
        },
        'geometry': {
            'type': 'Point',
            'coordinates': [115385.613800105580594, 498326.309618735569529]
        }
    }, {
        'type': 'Feature',
        'properties': {
            'name': 'zaandam',
            'locatie': 'Begraafplaats Zaandam',
            'latlngbounds': [
                [52.427765197923577, 4.843527754453777], //ne
                [52.424993722436575, 4.839236983372029]  //sw
                ]
        },
        'geometry': {
            'type': 'Point',
            'coordinates': [117874.561537614936242, 493315.177022678486537]
        }
    }, {
        'type': 'Feature',
        'properties': {
            'name': 'krommenie',
            'locatie': 'Begraafplaats Krommenie',
            'latlngbounds': [
                [52.505632736665376, 4.767510345506552], //ne
                [52.504335683602882, 4.76554899803385]  //sw
                ]
        },
        'geometry': {
            'type': 'Point',
            'coordinates': [112858.313553176471032, 502102.060004788276274]
        }
    }, {
        'type': 'Feature',
        'properties': {
            'name': 'wormerveer',
            'locatie': 'Begraafplaats Marktstaat Wormerveer',
            'latlngbounds': [
                [52.494225171926999, 4.786297934157103], //ne
                [52.493173027440271, 4.784928996783784]  //sw
                ]
        },
        'geometry': {
            'type': 'Point',
            'coordinates': [114143.583200616762042, 500835.48306642123498]
        }
    }, {
        'type': 'Feature',
        'properties': {
            'name': 'westzaan',
            'locatie': 'Begraafplaats Westzaan',
            'latlngbounds': [
                [52.45544393176985, 4.784943100856935], //ne
                [52.454701889418473, 4.782551282577115]  //sw
                ]
        },
        'geometry': {
            'type': 'Point',
            'coordinates': [113981.025601936664316, 496538.812681813375093]
        }
    }, {
        'type': 'Feature',
        'properties': {
            'name': 'krommeniedijk',
            'locatie': 'Begraafplaats Krommeniedijk',
            'latlngbounds': [
                [52.517459556189465, 4.751104468424248], //ne
                [52.517232577590697, 4.750628339885203]  //sw
                ]
        },
        'geometry': {
            'type': 'Point',
            'coordinates': [111806.941512365636299, 503486.735250812431332]
        }
    }]
};