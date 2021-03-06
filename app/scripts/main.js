/*
 Copyright (c) 2008-2014 Zaanstad Municipality

 Published under the GPL license.
 See https://github.com/teamgeo/webapp-begraafplaatsen/raw/master/license.txt for the full text
 of the license.
*/
/*jslint browser: true*/
/*global $, jQuery*/
/*global L, leaflet*/
/*global geojsonBegraafplaatsen*/
'use strict';
var map, marker, gpsLocation;
var rootUrl = 'http://geo.zaanstad.nl';
var wfsUrl = rootUrl + '/geoserver/ows';
var tileUrl = rootUrl + '/mapproxy/tms/1.0.0/Begraafplaatsen/EPSG28992/{z}/{x}/{y}.png'
var defaultParameters = {
    service: 'WFS',
    version: '1.1.0',
    request: 'GetFeature',
    maxFeatures: 50,
    outputFormat: 'json',
    SrsName: 'EPSG:28992'
};
var projdef = '+proj=sterea +lat_0=52.15616055555555 +lon_0=5.38763888888889 +k=0.9999079 +x_0=155000 +y_0=463000 +ellps=bessel +units=m +towgs84=565.2369,50.0087,465.658,-0.406857330322398,0.350732676542563,-1.8703473836068,4.0812 +no_defs';
proj4.defs('urn:ogc:def:crs:EPSG::28992', projdef);

var res = [3440.640, 1720.320, 860.160, 430.080, 215.040, 107.520, 53.760, 26.880, 13.440, 6.720, 3.360, 1.680, 0.840, 0.420, 0.210, 0.105, 0.05250];
var RD = new L.Proj.CRS(
    'EPSG:28992',
    projdef, {
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

function kaartTab() {
    $('#tabs a[href=#kaart]').tab('show');
}

function goToXY(x, y, zoom) {
    var cemeteryLocation = RD.projection.unproject(new L.Point(x, y), map.getMaxZoom());
    map.setView(cemeteryLocation, zoom, {
        animate: true
    });
}

function goToName(name) {
    for (var i = 0; i < geojsonBegraafplaatsen.features.length; i++) {
        if (name === geojsonBegraafplaatsen.features[i].properties.name) {

            var feature = geojsonBegraafplaatsen.features[i];
            var bounds = L.latLngBounds(feature.properties.latlngbounds);
            //L.rectangle(bounds, {color: "#ff7800", weight: 1}).addTo(map);
            map.fitBounds(bounds);
        }
    }
}

function mapBounds(name) {
    for (var i = 0; i < geojsonBegraafplaatsen.features.length; i++) {
        if (name === geojsonBegraafplaatsen.features[i].properties.name) {

            var feature = geojsonBegraafplaatsen.features[i];
            var bounds = L.latLngBounds(feature.properties.latlngbounds);
            var top = RD.projection.project(bounds.getNorthEast());
            var bottom = RD.projection.project(bounds.getSouthWest());
            //L.rectangle(bounds, {color: "#ff7800", weight: 1}).addTo(map);
            return bottom.x + "," + bottom.y + "," + top.x + "," + top.y;
        }
    }
}

function showPointer(item) {
    kaartTab();

    var rdPoint = new L.Point(item.geometry.coordinates[0], item.geometry.coordinates[1]),
        markerLocation = RD.projection.unproject(rdPoint, map.getMaxZoom()),
        label = $('<div/>', {}).append(
            $('<b/>', {
                'html': item.properties.naam
            }),
            $('<div/>', {
                'html': 'Geboren: ' + item.properties.dgeb_str + '<br/>' + 'Overleden: ' + item.properties.dovl_str + '<br/>' + 'Grafnummer: ' + item.properties.grafnummer + '<br/>' + 'Laag: ' + item.properties.laag + ' <br/><br/>'
            }),
            $('<a/>', {
                'html': '<span class="glyphicon glyphicon-record"></span> Inzoomen'
            })
        ).css('cursor', 'pointer')
            .click(function (e) {
                marker.closePopup();
                goToXY(item.geometry.coordinates[0],
                    item.geometry.coordinates[1],
                    15);
            })[0];

    map.setView(markerLocation, 15, {
        animate: false
    });
    if (marker) {
        map.removeLayer(marker);
    }

    marker = new L.marker(markerLocation, {
        title: 'Klik voor info',
        riseOnHover: true
    });
    marker.bindPopup(label, {
        closeButton: false,
        zoomAnimation: false
    });
    map.addLayer(marker);

    setTimeout(function () {
        marker.openPopup();
    }, 500);
}

function onLocationFound(e) {

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
            fillColor: '#A8A9A3',
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

function resultList(query, name, type) {

    $('#searchBtn').button('loading');
    var bbox = mapBounds(name),
        filter;

    if (type == 'naam') {
        filter = "naam ILIKE '%" + query.replace(' ', '%') + "%'";
    } else if (type == 'grafnummer') {
        filter = "grafnummer ILIKE '%" + query.replace(' ', '%') + "%'";
    }

    if (bbox) {
        filter = filter + " AND BBOX(geom," + bbox + ")";
    }


    var customParams = {
        //bbox: map.getBounds().toBBoxString(),
        typeName: 'geo:begraven_overledenen',
        sortBy: 'ngsl',
        cql_filter: filter
    },
        parameters = L.Util.extend(defaultParameters, customParams),
        newList = $('<div/>', {
            'id': 'list',
            'class': 'list-group'
        });

    $.ajax({
        url: wfsUrl + L.Util.getParamString(parameters),
        //url: 'fakeJson.json',
        type: 'get',
        dataType: 'json',
        jsonp: false,
        cache: false,
        timeout: 2000,
        tryCount : 0,
        retryLimit : 3,
        success: function (json) {

            $('#feedback').replaceWith(
                $('<div/>', {
                    'id': 'feedback',
                    'class': 'alert alert-info collapse in',
                    'html': '<small>Gevonden resultaten: ' + json.features.length + "<i class='pull-right'>Klik op de naam voor meer informatie</i></small>"
                })
            );

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
                                'html': '<span class="glyphicon glyphicon-map-marker"></span> Kaart'
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
                                'html': item.properties.ngsl_prt ? '<i>Naam partner: ' + item.properties.ngsl_prt + '</i>' : ''
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
            $('#searchBtn').button('reset');
            $('#searchValue').blur();
            $('html, body').animate({
                scrollTop: $('#feedback').position().top
            }, 'slow');

        },
        error : function(xhr, textStatus, errorThrown ) {
            if (this.tryCount <= this.retryLimit) {
                this.tryCount++;
                setTimeout((function() {
                    $.ajax(this);
                }.bind(this)),1000);
                return;
            } else {
                $('#feedback').replaceWith(
                    $('<div/>', {
                        'id': 'feedback',
                        'class': 'alert alert-warning collapse in',
                        'html': '<small>Problemen geconstateerd tijdens het opvragen van de gegevens, probeer s.v.p. op een later moment opnieuw te zoeken.</small>'
                    })
                );
            $('#searchBtn').button('reset');
            $('#searchValue').blur();
            }
        }
    });

}

function mapInit() {
    L.Icon.Default.imagePath = 'bower_components/leaflet/dist/images';

    var graven = new L.TileLayer(tileUrl, {
        tms: true,
        minZoom: 7,
        detectRetina: true,
        attribution: 'Zaanstad © 2013 Zaanstad'
    }),
        locationMarker = L.AwesomeMarkers.icon({
            prefix: 'glyphicon',
            icon: 'plus',
            iconColor: 'white',
            markerColor: 'darkpurple'
        }),
        begraafplaatsen = L.Proj.geoJson(geojsonBegraafplaatsen, {
            pointToLayer: function (feature, latlng) {
                var marker = L.marker(latlng, {
                    icon: locationMarker
                });
                var popup = L.popup({
                    closeButton: false
                })
                    .setContent($('<div/>', {}).append(
                            $('<h5/>', {
                                'html': feature.properties.locatie
                            }),
                            $('<p/>', {
                                'html': feature.properties.adres
                            }),
                            $('<a/>', {
                                'html': '<span class="glyphicon glyphicon-record"></span> Inzoomen'
                            })
                        ).css('cursor', 'pointer')
                        .click(function (e) {
                            marker.closePopup();
                            goToName(feature.properties.name);
                        })[0]);

                marker.bindPopup(popup);
                return marker;
            }
        });

    map = new L.Map('map', {
        crs: RD,
        layers: [graven, begraafplaatsen],
        continuousWorld: false,
        maxZoom: 16,
        minZoom: 7,
        zoomControl: false
    });

    map.addControl(new L.Control.ZoomMin({
        zoomLatLngBounds: begraafplaatsen.getBounds()
    }));

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

    // Fix for gray tiles on Chrome for Android
    setTimeout(function () {
        map.invalidateSize();
    }, 500);

    /*
    map.on('click', function (e) {
        if (window.console) {
            var point = RD.projection.project(e.latlng);
            console.log('RD X: ' + point.x + ', Y: ' + point.y);
            console.log('Lat: ' + e.latlng.lat + ', Lon: ' + e.latlng.lng);
        }
    });
    */
}

function guiInit() {
    $.each(geojsonBegraafplaatsen.features, function (i, value) {
        if (value.properties.name) {
            $('#begraafplaatsOption').append($('<option>').text(value.properties.locatie).attr('value', value.properties.name));
            $('#begraafplaatsList').append(
                $('<a/>', {
                    'class': 'lead',
                    'href': '#',
                    'html': value.properties.locatie
                }).on('click', function () {
                    kaartTab();
                    $("#begraafplaatsOption > option[value=" + value.properties.name + "]").prop("selected", true);
                    setTimeout(function () {
                        goToName(value.properties.name);
                        }, 250);
                }),
                $('<br/>')
            );
        }
    });
    if (window.location.hash) {
        $('#tabs a[href=' + window.location.hash + ']').tab('show');
    } else {
        $('#tabs a[href=#kaart]').tab('show');
    }
}

$(function () {
    $('#tabs a[href="#kaart"]').on('shown.bs.tab', function (e) {
        setTimeout(function () {
            map.invalidateSize();
        }, 250);
    });
    $(".dropdown-menu li a").click(function () {
        var selText = $(this).text();
        $(this).parents('.input-group-btn').find('.dropdown-toggle').html(selText + ' <span class="caret"></span>');
        $(this).parents('.input-group-btn').find('.dropdown-toggle').val(selText.toLowerCase());
        $('#searchValue').val('');
    });
    $(document).on('shown.bs.tab', function (event) {
        window.location.hash = $(event.target).attr('href');
        $(window).scrollTop(0);
    });
    $(document).ready(function () {
        guiInit();
        mapInit();
    });
    $(window).resize(function () {
        var height = window.innerHeight ? window.innerHeight : $(window).height();
        $('#map').css('height', (height - 103));
    }).resize();
    FastClick.attach(document.body);
});
