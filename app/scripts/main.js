/*
 Copyright (c) 2008-2013 Zaanstad Municipality

 Published under the GPL license.
 See https://github.com/teamgeo/webapp-begraafplaatsen/raw/master/license.txt for the full text
 of the license.
*/

/*jslint browser: true*/
/*global $, jQuery*/
/*global L, leaflet*/
'use strict';
var map, marker, gpsLocation;
var rootUrl = 'http://geo.zaanstad.nl/geoserver/ows';
var defaultParameters = {
    service: 'WFS',
    version: '1.1.0',
    request: 'GetFeature',
    maxFeatures: 50,
    outputFormat: 'json',
    SrsName: 'EPSG:28992'
};
var res = [3440.640, 1720.320, 860.160, 430.080, 215.040, 107.520, 53.760, 26.880, 13.440, 6.720, 3.360, 1.680, 0.840, 0.420, 0.210, 0.105, 0.05250];
var RD = new L.Proj.CRS('EPSG:28992', '+proj=sterea +lat_0=52.15616055555555 +lon_0=5.38763888888889 +k=0.9999079 +x_0=155000 +y_0=463000 +ellps=bessel +units=m +towgs84=565.2369,50.0087,465.658,-0.406857330322398,0.350732676542563,-1.8703473836068,4.0812 +no_defs', {
    transformation: new L.Transformation(1, 285401.920, -1, 903401.920),
    resolutions: res
});

$.urlParam = function (name) {
    var results = new RegExp('[\\?&]' + name + '=([^&#]*)').exec(window.location.href);
    if (results === null) {
        return null;
    } else {
        return results[1] || 0;
    }
};

function showPointer(item) {
    $('#tabs a[href=#kaart]').tab('show');
    $(window).scrollTop(0);

    var rdPoint = new L.Point(item.geometry.coordinates[0], item.geometry.coordinates[1]),
        markerLocation = RD.projection.unproject(rdPoint, map.getMaxZoom()),
        label = '<b>' + item.properties.naam + '</b><br/>' +
            'Geboren: ' + item.properties.dgeb_str + '<br/>' +
            'Overleden: ' + item.properties.dovl_str + '<br/>' +
            'Grafnummer: ' + item.properties.grafnummer + '<br/>' +
            'Laag: ' + item.properties.laag + '<br/>';

    map.setView(markerLocation, 16, {
        animate: false
    });
    if (marker) {
        map.removeLayer(marker);
    }

    marker = new L.marker(markerLocation);
    marker.bindPopup(label, {
        zoomAnimation: false
    });
    map.addLayer(marker);

    setTimeout(function () {
        map.invalidateSize();
        marker.openPopup();
    }, 500);
}

function goToXY(x, y) {
    var cemeteryLocation = RD.projection.unproject(new L.Point(x, y), map.getMaxZoom());
    map.setView(cemeteryLocation, 13, {
        animate: false
    });
    setTimeout(function () {
        map.invalidateSize();
    }, 500);
}

function goToName(name) {
    $('#tabs a[href=#kaart]').tab('show');
    $(window).scrollTop(0);
    for (var i = 0; i < geojsonBegraafplaatsen.features.length; i++) {
        if (name === geojsonBegraafplaatsen.features[i].properties.name) {
            goToXY(geojsonBegraafplaatsen.features[i].geometry.coordinates[0], geojsonBegraafplaatsen.features[i].geometry.coordinates[1]);
        }
    }
}

function onLocationFound(e) {
    console.log('locationFound');

    if (gpsLocation) {
        gpsLocation.eachLayer(function (layer) {
            layer.setLatLng(e.latlng);
        });
    } else {
        var radius = e.accuracy / 2;
        var circle = L.circle(e.latlng, radius, {
            stroke: true,
            weight: 2,
            color: '#0082A4',
            fillColor: '#A8A9A3', // '#00A5C7',
            fillOpacity: 0.2,
            clickable: false
        });
        var point = new L.CircleMarker(e.latlng, {
            radius: 5,
            weight: 1,
            color: '#00A5C7',
            fill: true,
            fillColor: '#0082A4',
            fillOpacity: 1,
            clickable: false
        });
        gpsLocation = L.layerGroup([circle, point])
            .addTo(map);
    }
}

function handleZoom(e) {
    if (map.getZoom() > 12) {
        $('.awesome-marker').hide();
    } else {
        $('.awesome-marker').show();
    }
}

function resultList(query) {

    $('#pleaseWaitDialog').modal();

    var customParams = {
        //bbox : map.getBounds().toBBoxString(),
        typeName: 'geo:begraven_overledenen',
        sortBy: 'ngsl',
        cql_filter: "naam ILIKE '%" + query + "%'"
    };
    var parameters = L.Util.extend(defaultParameters, customParams);

    $.ajax({
        url: rootUrl + L.Util.getParamString(parameters),
        //url: 'fakeJson.json',
        type: 'get',
        dataType: 'json',
        jsonp: false,
        success: function (json) {

            $('#feedback').replaceWith(
                $('<div/>', {
                    'id': 'feedback',
                    'class': 'alert alert-info collapse in',
                    'html': '<small>Gevonden resultaten: ' + json.features.length + "<i class='pull-right'>Klik op de naam voor meer informatie</i></small>"
                })
            );

            var newList = $('<div/>', {
                'id': 'list',
                'class': 'list-group'
            });

            $.each(json.features, function (i, item) {
                newList.append(
                    $('<a/>', {
                        'class': 'list-group-item',
                        'data-toggle': 'active'
                    }).append(
                        $('<h4/>', {
                            'class': 'list-group-item-heading',
                            'html': item.properties.naam
                        }).append(
                            $('<button/>', {
                                'class': 'btn btn-default pull-right',
                                'html': "<span class='glyphicon glyphicon-map-marker'></span> Kaart"
                            }).on('click', function () {
                                showPointer(item);
                            })),
                        $('<p/>', {
                            'class': 'list-group-item-text',
                            'html': '<i>Overleden: ' + item.properties.dovl_str + '</i>'
                        }).append(
                            $('<div/>', {
                                'class': 'collapse',
                                'html': '<strong>Grafnummer: ' + item.properties.grafnummer + '</strong>'
                            }),
                            $('<div/>', {
                                'class': 'collapse',
                                'html': '<i>Geboren: ' + item.properties.dgeb_str + '</i>'
                            }),
                            $('<div/>', {
                                'class': 'collapse',
                                'html': '<i>Overleden: ' + item.properties.dovl_str + '</i>'
                            }),
                            $('<div/>', {
                                'class': 'collapse',
                                'html': '<i>Naam partner: ' + item.properties.ngsl_prt + '</i>'
                            })
                        )
                    ).on('click', function (e) {
                        var previous = $(this).closest('.list-group').children('.active');
                        previous.children('.list-group-item-text').children().toggle();
                        previous.removeClass('active');
                        $(e.currentTarget).addClass('active');
                        $(e.currentTarget).children('.list-group-item-text').children().toggle();
                    })
                );
            });
            $('#list').replaceWith(newList);
            $('#pleaseWaitDialog').modal('hide');
            $('#searchValue').blur();
        }
    });
}

function onEachFeature(feature, layer) {
    // does this feature have a property named popupContent?
    if (feature.properties && feature.properties.locatie) {
        layer.bindPopup($('<div/>', {}).append(
                $('<h5/>', {
                    'html': '<span class="glyphicon glyphicon-zoom-in"></span> ' + feature.properties.locatie
                }),
                $('<p/>', {
                    'html': 'Adres...'
                }),
                $('<small/>', {
                    'html': '<i>Klik om in te zoomen</i>'
                })
            )
            .css('cursor', 'pointer')
            .click(function () {
                goToName(feature.properties.name);
            })[0]);
    }
}

function mapInit() {
    L.Icon.Default.imagePath = 'bower_components/leaflet/dist/images';

    var graven = L.tileLayer.wms('http://geo.zaanstad.nl/geowebcache/service/wms?', {
        layers: 'Begraafplaatsen',
        format: 'image/png8',
        transparent: false,
        tiled: true,
        version: '1.1.1',
        reuseTiles: true,
        attribution: 'Zaanstad © 2013 Zaanstad'
        }),
        locationMarker = L.AwesomeMarkers.icon({
            prefix: 'glyphicon',
            icon: 'plus',
            iconColor: 'white',
            markerColor: 'darkpurple'
        }),
        begraafplaatsen = L.Proj.geoJson(geojsonBegraafplaatsen, {
            onEachFeature: onEachFeature,
            pointToLayer: function (feature, latlng) {
                return L.marker(latlng, {
                    icon: locationMarker
                });
            },
            filter: function (feature, layer) {
                return feature.properties.In_beheer;
            }
        });

    console.log(RD.projection.unproject([102009.0, 480557.0]));
    console.log(RD.projection.unproject([129270.0, 506221.0]));

    map = new L.Map('map', {
        crs: RD,
        layers: [graven, begraafplaatsen],
        continuousWorld: false,
        //maxBounds: new L.LatLngBounds([52.53486271003716, 4.583721606054298],
        //                              [52.37211973493022, 5.013210485619031]),
        maxZoom: 16,
        minZoom: 7
    });

    if ($.urlParam('begraafplaats')) {
        goToName($.urlParam('begraafplaats'));
        $("#begraafplaatsOption > option[value=" + $.urlParam('begraafplaats') + "]").prop("selected", true);
    } else {
        map.fitBounds(begraafplaatsen.getBounds());
    }

    map.on('locationfound', onLocationFound);
    map.on('zoomend', handleZoom);

    map.locate({
        setView: false,
        enableHighAccuracy: true,
        watch: true,
        maximumAge: 20,
        maxZoom: 17
    });

    handleZoom();

    map.on('click', function (e) {
        if (window.console) {
            var point = RD.projection.project(e.latlng);
            console.log('RD X: ' + point.x + ', Y: ' + point.y);
            console.log('Lat: ' + e.latlng.lat + ', Lon: ' + e.latlng.lng);
        }
        //onMapClick(e);
    });
    
}

function guiInit() {
    $.each(geojsonBegraafplaatsen.features, function (i, value) {
        if (value.properties.name) {
            $('#begraafplaatsOption').append($('<option>').text(value.properties.locatie).attr('value', value.properties.name));
            $('#begraafplaatsList').append($('<button/>', {
                'class': 'btn btn-default',
                'html': value.properties.locatie
            }).on('click', function () {
                goToName(value.properties.name);
            }));
        }
    });
}

$(document).ready(function () {
    guiInit();
    mapInit();
});

$(window).resize(function () {
    var height = window.innerHeight ? window.innerHeight : $(window).height();
    $('#map').css('height', (height - 102));
}).resize();