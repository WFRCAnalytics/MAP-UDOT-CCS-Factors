//javascript for display Continuous Count Station Factors
//written by Bill Hereth August 2021

var cmbStationGroup;
var stationGroupsCCSs = [];
var aCCSs;
var stations;
var iFirst=true;
var sSeries = "SG";
var storeDOWFactors;
var storeWDFactors;
var defaultYearGroup = "2015-2019";
var curYearGroup = defaultYearGroup;
var defaultMonthGroup = "Year";
var curMonthGroup = defaultMonthGroup;
var lLegendOne;
var sATRLocationsLayer = "Continuous Count Station Locations";
var lyrATRs;
var sATRs;
var defaultStationGroup = "COT";
var curStationGroup = defaultStationGroup;
var curSeries = "SG";
var lyrSegments;
var sSegmentLayerName = "SegmentsWithFactorGroups";
var sStandardModeText = "<strong>Standard Mode:</strong> Contains the finalized set of station groups factors that are included in the Master Segments Shapefile. This contains only one set of day-of-week factors. For the Wastach Front Model Area, the <b>Tue-Thu Average</b> was used in preparing the AADT forecasts found in the <a href=\"https://wfrc.org/traffic-volume-map/\" target=\"_blank\">Traffic Volume Map</a>. <br/><br/>Please click on a segment in the map to get the applicable factors for that segment.";
var sDevelopmentModeText = "<strong>Development Mode:</strong> Includes additional day-of-week and season factors for different combinations of month and year groups. Additional station groups are available that were considered before the final cut. To compare station groups against each other, set the CCS Group to <strong>GRP: All Station Groups in Utah </strong> and the groups are listed in the CCS stations selection box."

define(['dojo/_base/declare',
    'jimu/BaseWidget',
    'dijit/registry',
    'dojo/dom',
    'dojo/dom-style',
    'dijit/dijit',
    'dojox/charting/Chart',
    'dojox/charting/themes/Claro',
    'dojox/charting/plot2d/Lines',
    'dojox/charting/plot2d/Columns',
    "dojox/charting/widget/Legend",
    "dojox/charting/widget/SelectableLegend",
    'dojox/layout/TableContainer',
    'dojox/layout/ScrollPane',
    'dijit/layout/ContentPane',
    'dijit/form/TextBox',
    'dijit/form/ToggleButton',
    'jimu/LayerInfos/LayerInfos',
    'esri/tasks/query',
    'esri/tasks/QueryTask',
    'esri/layers/FeatureLayer',
    'esri/dijit/FeatureTable',
    'esri/symbols/SimpleFillSymbol',
    'esri/symbols/SimpleLineSymbol',
    'esri/symbols/SimpleMarkerSymbol',
    'esri/renderers/UniqueValueRenderer',
    'esri/InfoTemplate',
    'esri/Color',
    'esri/map',
    'esri/geometry/Extent',
    'dojo/store/Memory',
    'dojox/charting/StoreSeries',
    'dijit/Dialog',
    'dijit/form/Button',
    'dijit/form/RadioButton',
    'dijit/form/MultiSelect',
    'dojox/form/CheckedMultiSelect',
    'dijit/form/Select',
    'dijit/form/ComboBox',
    'dijit/form/CheckBox',
    'dojo/store/Observable',
    'dojox/charting/axis2d/Default',
    'dojo/domReady!'],
function(declare, BaseWidget, registry, dom, domStyle, dijit, Chart, Claro, Lines, Columns, Legend, SelectableLegend, TableContainer, ScrollPane, ContentPane, TextBox, ToggleButton, LayerInfos, Query, QueryTask, FeatureLayer, FeatureTable, SimpleFillSymbol, SimpleLineSymbol, SimpleMarkerSymbol, UniqueValueRenderer, InfoTemplate, Color, Map, Extent, Memory, StoreSeries, Dialog, Button, RadioButton, MutliSelect, CheckedMultiSelect, Select, ComboBox, CheckBox, Observable) {
    //To create a widget, you need to derive from BaseWidget.
    
return declare([BaseWidget], {
// DemoWidget code goes here

//please note that this property is be set by the framework when widget is loaded.
//templateString: template,

baseClass: 'jimu-widget-demo',

postCreate: function() {
    this.inherited(arguments);
    console.log('postCreate');
},

startup: function() {
    console.log('startup');
    
    this.inherited(arguments);
    this.map.setInfoWindowOnClick(false); // turn off info window (popup) when clicking a feature


    //Widen the widget panel to provide more space for charts
    var panel = this.getPanel();
    var pos = panel.position;
    pos.width = 850;
    panel.setPosition(pos);
    panel.panelManager.normalizePanel(panel);

    var parent = this;

    //Initialize Selection Layer, FromLayer, and ToLayer and define selection colors
    var layerInfosObject = LayerInfos.getInstanceSync();
    for (var j=0, jl=layerInfosObject._layerInfos.length; j<jl; j++) {
        var currentLayerInfo = layerInfosObject._layerInfos[j];        
        if (currentLayerInfo.title == sATRLocationsLayer) { //must mach layer title
            this.lyrATRs = layerInfosObject._layerInfos[j].layerObject;
        } else if (currentLayerInfo.title == sSegmentLayerName) {
            this.lyrSegments = layerInfosObject._layerInfos[j].layerObject;
        }
    }

    parent=this;
    
    //Populate wdfactors datastore
    dojo.xhrGet({
        url: "widgets/CustomSidebar/data/wdfactors.json",
        handleAs: "json",
        load: function(obj) {
                /* here, obj will already be a JS object deserialized from the JSON response */
                console.log('wdfactors.json');
                wdFactors = obj;

                //Populate dowFactors DataStore
                storeWDFactors = Observable(new Memory({
                    data: {
                        identifier: "SG",
                        items: wdFactors
                    }
                }));
        },
        error: function(err) {
                /* this will execute if the response couldn't be converted to a JS object,
                        or if the request was unsuccessful altogether. */
        }
    });            

    //Populate dowfactors datastore
    dojo.xhrGet({
        url: "widgets/CustomSidebar/data/dowfactors.json",
        handleAs: "json",
        load: function(obj) {
                /* here, obj will already be a JS object deserialized from the JSON response */
                console.log('dowfactors.json');
                dowFactors = obj;

                //Populate dowFactors DataStore
                storeDOWFactors = Observable(new Memory({
                    data: {
                        identifier: "SG",
                        label: "StationID",
                        items: dowFactors
                    }
                }));
                parent.UpdateCCSs(curStationGroup);
                parent.UpdateCharts();
        },
        error: function(err) {
                /* this will execute if the response couldn't be converted to a JS object,
                        or if the request was unsuccessful altogether. */
        }
    });

    //Populate monthfactors datastore
    dojo.xhrGet({
        url: "widgets/CustomSidebar/data/monthfactors.json",
        handleAs: "json",
        load: function(obj) {
                /* here, obj will already be a JS object deserialized from the JSON response */
                console.log('monthfactors.json');
                monthFactors = obj;

                //Populate dowFactors DataStore
                storeMonthFactors = Observable(new Memory({
                    data: {
                        identifier: "SG",
                        items: monthFactors
                    }
                }));
        },
        error: function(err) {
                /* this will execute if the response couldn't be converted to a JS object,
                        or if the request was unsuccessful altogether. */
        }
    });            

    //Populate season factors datastore
    dojo.xhrGet({
        url: "widgets/CustomSidebar/data/seasonfactors.json",
        handleAs: "json",
        load: function(obj) {
                /* here, obj will already be a JS object deserialized from the JSON response */
                console.log('dowfactors.json');
                seasonFactors = obj;

                //Populate dowFactors DataStore
                storeSsnFactors = Observable(new Memory({
                    data: {
                        identifier: "SG",
                        label: "StationID",
                        items: seasonFactors
                    }
                }));
                parent.UpdateCCSs(curStationGroup);
                parent.UpdateCharts();
        },
        error: function(err) {
                /* this will execute if the response couldn't be converted to a JS object,
                        or if the request was unsuccessful altogether. */
        }
    });         

    //Get StationGroups_CCSs
    dojo.xhrGet({
        url: "widgets/CustomSidebar/data/stationgroups_ccs.json",
        handleAs: "json",
        load: function(obj) {
                /* here, obj will already be a JS object deserialized from the JSON response */
                console.log('stationgroups.json');
                stationGroupsCCSs = obj;
        },
        error: function(err) {
                /* this will execute if the response couldn't be converted to a JS object,
                        or if the request was unsuccessful altogether. */
        }
    });

    //Populate Station Groups
    dojo.xhrGet({
        url: "widgets/CustomSidebar/data/stationgroups_finalcut.json",
        handleAs: "json",
        load: function(obj) {
                /* here, obj will already be a JS object deserialized from the JSON response */
                console.log('stationgroups_finalcut.json');
                stationGroups_finalcut = obj;
                cmbStationGroup = new Select({
                    id: "selectCCSs",
                    name: "selectCCSsName",
                    options: stationGroups_finalcut,
                    onChange: function(){
                        curStationGroup = this.value;
                        parent.UpdateCCSs(curStationGroup);
                        parent.UpdateCharts();
                        parent.selectSegments();
                    }
                }, "cmbStationGroups");
                cmbStationGroup.set('value', curStationGroup);
                cmbStationGroup.startup();
                parent.UpdateCCSs(curStationGroup);
                //Populate geoIDs DataStore
                var storeStationGroups = Observable(new Memory({
                    data: {
                        identifier: "value",
                        label: "StationGroup",
                        items: stationGroups_finalcut
                    }
                }));
        },
        error: function(err) {
                /* this will execute if the response couldn't be converted to a JS object,
                        or if the request was unsuccessful altogether. */
        }
    });


    //Get station groups full lists
    dojo.xhrGet({
        url: "widgets/CustomSidebar/data/stationgroups.json",
        handleAs: "json",
        load: function(obj) {
                /* here, obj will already be a JS object deserialized from the JSON response */
                console.log('stationgroups.json');
                stationGroups = obj;
        },
        error: function(err) {
                /* this will execute if the response couldn't be converted to a JS object,
                        or if the request was unsuccessful altogether. */
        }
    });

    //Populate MonthGroups
    dojo.xhrGet({
        url: "widgets/CustomSidebar/data/monthgroups.json",
        handleAs: "json",
        load: function(obj) {
            /* here, obj will already be a JS object deserialized from the JSON response */
            console.log('monthgroups.json');
            monthGroups = obj;
            cmbMonthGroups = new CheckedMultiSelect({
                id: "selectMonthGroups",
                name: "selectMonthGroupsName",
                options: monthGroups,
                multiple: false,
                onChange: function(){
                    curMonthGroup = this.value;
                    parent.UpdateCharts();
                }
            }, "cmbMonthGroups");
            cmbMonthGroups.startup();
            cmbMonthGroups.set("value", defaultYearGroup);
        },
        error: function(err) {
                /* this will execute if the response couldn't be converted to a JS object,
                        or if the request was unsuccessful altogether. */
        }
    });

    //Populate Years
    dojo.xhrGet({
        url: "widgets/CustomSidebar/data/yeargroups.json",
        handleAs: "json",
        load: function(obj) {
            /* here, obj will already be a JS object deserialized from the JSON response */
            console.log('monthgroups.json');
            yearGroups = obj;
            cmbYears = new CheckedMultiSelect({
                id: "selectYears",
                name: "selectYearsName",
                options: yearGroups,
                multiple: false,
                onChange: function(){
                    curYearGroup = this.value;
                    parent.UpdateCharts();
                }
            }, "cmbYears");
            cmbYears.startup();
            cmbYears.set("value", curYearGroup);
        },
        error: function(err) {/* this will execute if the response couldn't be converted to a JS object,
                        or if the request was unsuccessful altogether. */
        }
    });
    
    //Populate Series
    cmbSeries = new CheckedMultiSelect({
        id: "selectSeries",
        name: "selectSeriessName",
        options: [{"label" : "CCSs"             , "value" : "SG"},
                            {"label" : "Year Groups", "value" : "YG"}],
        onChange: function(){
            curSeries = this.value;

            if (curSeries=='YG') {
                cmbYears.multiple = true;
                dom.byId("CCSSelectionAreaTitle" ).style.display = 'none';
                dom.byId("CCSSelectionAreaButton").style.display = 'none';
                dom.byId("CCSSelectionArea"      ).style.display = 'none';
                dom.byId("tables_dowfactors"     ).style.display = 'none';
                dom.byId("tables_monthfactors"   ).style.display = 'none';
            } else if (curSeries=='SG') {
                cmbYears.multiple = false;
                if (curYearGroup.length>1) {    // reduce to single selection
                    curYearGroup = defaultYearGroup;
                    cmbYears.set("value", curYearGroup);
                }
                dom.byId("CCSSelectionAreaTitle" ).style.display = 'block';
                dom.byId("CCSSelectionAreaButton").style.display = 'block';
                dom.byId("CCSSelectionArea"      ).style.display = 'block';
                dom.byId("tables_dowfactors"     ).style.display = 'block';
                dom.byId("tables_monthfactors"   ).style.display = 'block';
            }
            cmbYears.startup();
            cmbYears.onChange();
            parent.UpdateCharts();
        }
    }, "cmbSeries");
    cmbSeries.startup();
    cmbSeries.set("value", "SG");



                // Create the chart within it's "holding" node
    // Global so users can hit it from the console
    cChartOne = new Chart("chartOne", {
        title: "DOW Factors",
        titlePos: "top",
        titleFont: "normal normal bold 12pt Verdana",
        titleGap: 5
    });

    // Set the theme
    cChartOne.setTheme(Claro);

    // Add the only/default plot 
    cChartOne.addPlot("default", {
        type: "Lines",
        gap: 10
    });
    
    // Add axes
    cChartOne.addAxis("x", { microTickStep: 1, minorTickStep: 1, majorTickStep: 1,
            font: "normal normal normal 8pt Verdana",
            labels: [
                        {value:1, text:"Mon"},
                        {value:2, text:"Tue"},
                        {value:3, text:"Wed"},
                        {value:4, text:"Thu"},
                        {value:5, text:"Fri"},
                        {value:6, text:"Sat"},
                        {value:7, text:"Sun"},
                    ],
            title: "", //Day of Week
            titleOrientation: "away",
            titleFont: "normal normal normal 10pt Verdana",
            titleGap: 10
        }
    );
    cChartOne.addAxis("y", { vertical: true, fixLower: "major", fixUpper: "major", min: 0});

    // Create the legend
    //lLegendOne = new Legend({ chart: cChartOne }, "legendOne");
    lLegendOne = new dojox.charting.widget.SelectableLegend({chart: cChartOne, outline: true, horizontal: false},"legendOne");

    cChartOne.render();

    // Create the chart within it's "holding" node
    // Global so users can hit it from the console
    cChartTwo = new Chart("chartTwo", {
        title: "Season/Month Factors",
        titlePos: "top",
        titleFont: "normal normal bold 12pt Verdana",
        titleGap: 5
    });
    // Set the theme
    cChartTwo.setTheme(Claro);

    // Add the only/default plot 
    cChartTwo.addPlot("default", {
        type: "Lines",
        gap: 10
    });
    
    // Add axes
    cChartTwo.addAxis("x", { microTickStep: 1, minorTickStep: 1, majorTickStep: 1,
            font: "normal normal normal 8pt Verdana",
            labels: [
                        {value: 1, text:"Jan"},
                        {value: 2, text:"Feb"},
                        {value: 3, text:"Mar"},
                        {value: 4, text:"Apr"},
                        {value: 5, text:"May"},
                        {value: 6, text:"Jun"},
                        {value: 7, text:"Jul"},
                        {value: 8, text:"Aug"},
                        {value: 9, text:"Sep"},
                        {value:10, text:"Oct"},
                        {value:11, text:"Nov"},
                        {value:12, text:"Dec"},
                    ],
            title: "", //Month
            titleOrientation: "away",
            titleFont: "normal normal normal 10pt Verdana",
            titleGap: 10
        }
    );
    cChartTwo.addAxis("y", { vertical: true, fixLower: "major", fixUpper: "major", min: 0});

    // Create the legend
    //lLegendTwo = new Legend({ chart: cChartTwo }, "legendTwo");
    lLegendTwo = new dojox.charting.widget.SelectableLegend({chart: cChartTwo, outline: false, horizontal: false},"legendTwo");

    cChartTwo.render();

    new ToggleButton({
        showLabel: true,
        checked: false,
        onChange: function(val) {
            // make sure when toggling between development and standard mode if group does not start with "C" revert to defaultStationGroup
            if (curStationGroup.charAt(0)!='C') {
                    curStationGroup = defaultStationGroup;
            }
            if (val) {
                this.set('label',"View Standard Mode");
                dom.byId("advsettings").style.display = 'inline';
                dom.byId("devtext").innerHTML = sDevelopmentModeText;
                cmbStationGroup.set("options", stationGroups)
            } else {
                this.set('label',"View Development Mode");
                dom.byId("advsettings").style.display = 'none';
                dom.byId("devtext").innerHTML = sStandardModeText;
                cmbSeries.set("value",'SG');
                cmbSeries.onChange();
                curMonthGroup = defaultMonthGroup;
                curYearGroup = defaultYearGroup
                cmbStationGroup.set("options", stationGroups_finalcut)
            }
            cmbStationGroup.startup();
            cmbStationGroup.set("value", curStationGroup);
            cmbYears.set("value",curYearGroup)
            cmbMonthGroups.set("value", curMonthGroup);

            parent.UpdateCCSs(curStationGroup);
            parent.UpdateCharts();
        },
        label: "View Development Mode"
    }, "devtoggle");

    // default standard mode
    dom.byId("devtext").innerHTML = sStandardModeText;


    //setup click functionality
    this.map.on('click', selectSegment);

    function pointToExtent(map, point, toleranceInPixel) {  
        var pixelWidth = parent.map.extent.getWidth() / parent.map.width;  
        var toleranceInMapCoords = toleranceInPixel * pixelWidth;  
        return new Extent(point.x - toleranceInMapCoords,  
                        point.y - toleranceInMapCoords,  
                        point.x + toleranceInMapCoords,  
                        point.y + toleranceInMapCoords,  
                        parent.map.spatialReference);  
    }

    //Setup Function for Selecting Features

    function selectSegment(evt) {
        console.log('selectSegment');
    
        var query = new Query();  
        query.geometry = pointToExtent(parent.map, evt.mapPoint, 7);
        query.returnGeometry = false;
        query.outFields = ["*"];

        var querySegment = new QueryTask(parent.lyrSegments.url);
        querySegment.execute(query,clickSegment);
        
        //Segment search results
        function clickSegment(results) {
            console.log('clickSegment');
        
            var resultCount = results.features.length;
            if (resultCount>0) {
                //use first feature only
                var featureAttributes = results.features[0].attributes;
                _segID           = featureAttributes['SEGID'];
                _segStationGroup = featureAttributes['COFACGEO'];

                curStationGroup = _segStationGroup;
                cmbStationGroup.set('value',curStationGroup);
                parent.UpdateCCSs(curStationGroup);
                parent.UpdateCharts();

            }
        }
    }
},

UpdateCCSs: function(a_strStationGroup) {

    //Build Options
    aCCSs = [];
    curSeletectedStations = [];
    sATRs="IN(";
    for (var i=0;i<stationGroupsCCSs.length;i++){
        if (stationGroupsCCSs[i].StationGroup==a_strStationGroup) {
            aCCSs.push({"label" : stationGroupsCCSs[i].StationName, "value" : stationGroupsCCSs[i].StationID});
            if (dom.byId("button").innerHTML == "Unselect All") {
                curSeletectedStations.push(stationGroupsCCSs[i].StationID);
            }
            sATRs += stationGroupsCCSs[i].StationID + ","
        }
    }

    sATRs = sATRs.slice(0,-1) + ")";

    //Populate Station Multi Select List

    parent = this;

    if (iFirst) {
        cmbCCS = new CheckedMultiSelect({
            id: "selectSG",
            name: "selectSGName",
            options: aCCSs,
            multiple: true,
            onChange: function(){
                curSeletectedStations = this.value;
                parent.UpdateCharts();
            }
        }, "cmbCCSs");
        cmbCCS.startup();
        cmbCCS.set("value", curSeletectedStations);
        iFirst = false;
    } else {
        cmbCCS.set("options", aCCSs).reset();
        cmbCCS.set("value", curSeletectedStations);
        cmbCCS.startup();
    }
},

selectSegments: function() {
    console.log('selectSegments');
    query = new esri.tasks.Query();
    query.returnGeometry = true;
    query.outFields = ["*"];

    _fieldname = this._getStationGroupFacGeoGroup(curStationGroup);

    query.where = _fieldname + "='" + curStationGroup + "'";

    var uvrJson = {"type": "uniqueValue",
        "field1": _fieldname,
        "defaultSymbol": {
                "color": [170,170,170,128],
                "width": 1.33,
                "type": "esriSLS",
                "style": "esriSLSSolid",
                "type": "esriSLS"
        },
        "uniqueValueInfos": [{
            "value": curStationGroup,
            "symbol": {
                "color": [255,105,180,255],
                "width": 4,
                "type": "esriSLS",
                "style": "esriSLSSolid",
                "type": "esriSLS"
            }
        }]
    };

    var renderer = new UniqueValueRenderer(uvrJson);
    this.lyrSegments.setRenderer(renderer);

},

onOpen: function(){
    console.log('onOpen');
},

onClose: function(){
    //this.ClickClearButton();
    console.log('onClose');
},

onMinimize: function(){
    console.log('onMinimize');
},

onMaximize: function(){
    console.log('onMaximize');
},

onSignIn: function(credential){
    /* jshint unused:false*/
    console.log('onSignIn');
},

onSignOut: function(){
    console.log('onSignOut');
},

ShowCCSForGroup: function(){
    
    queryTask = new esri.tasks.QueryTask(this.lyrATRs.url);
    
    query = new esri.tasks.Query();
    query.returnGeometry = true;
    query.outFields = ["*"];
    query.where = "STATION_N " + sATRs;
    
    queryTask.execute(query, showResults);

    parent = this;

    //hide all
    this.lyrATRs.setDefinitionExpression("STATION_N IN ('')");

    function showResults(featureSet) {

        var feature, featureId;

        //QueryTask returns a featureSet.    Loop through features in the featureSet and add them to the map.

        //if (featureSet.features[0].geometry.type == "multipoint"){ 
        //    //clearing any graphics if present. 
        //    parent.map.graphics.clear(); 
        //    newExtent = new Extent(featureSet.features[0].geometry.getExtent()) 
        //        for (i = 0; i < featureSet.features.length; i++) { 
        //            var graphic = featureSet.features[i]; 
        //            var thisExtent = graphic.geometry.getExtent(); 

        //            // making a union of extent or previous feature and current feature. 
        //            newExtent = newExtent.union(thisExtent); 
        //            //graphic.setSymbol(sfs); 
        //            //graphic.setInfoTemplate(popupTemplate); 
        //            parent.map.graphics.add(graphic); 
        //        } 
        //    parent.map.setExtent(newExtent.expand(1.5)); 
        //}
        parent.lyrATRs.setDefinitionExpression("STATION_N " + sATRs);
    }
},

ShowAll: function(){

    var btnShowHideAll = dom.byId("button");

    if (btnShowHideAll.innerHTML == "Select All") {
        curSeletectedStations = [];
        for (var i=0;i<stationGroupsCCSs.length;i++){
            if (stationGroupsCCSs[i].StationGroup==curStationGroup) {
                curSeletectedStations.push(stationGroupsCCSs[i].StationID);
            }
        }
        btnShowHideAll.innerHTML = "Unselect All";
    } else if (btnShowHideAll.innerHTML == "Unselect All") {
        curSeletectedStations = [];
        btnShowHideAll.innerHTML = "Select All";
    }
    cmbCCS.set("value", curSeletectedStations);
    cmbCCS.startup();
    this.UpdateCharts();
},

UpdateCharts: function(){
    console.log('UpdateCharts');
    
    var sValue = "";

    //AUTO SELECT ALL
    //curSeletectedStations = [];
    //for (var i=0;i<stationGroupsCCSs.length;i++){
    //    if (stationGroupsCCSs[i].StationGroup==curStationGroup) {
    //        curSeletectedStations.push(stationGroupsCCSs[i].StationID);
    //    }
    //}

    //Remove existing series
    while( cChartOne.series.length > 0 ) {
        cChartOne.removeSeries(cChartOne.series[0].name);
    }

    if (curSeries=='SG') {
        var tStoreSeriesSG = new StoreSeries(storeDOWFactors, { query: { SG: curStationGroup, YG: curYearGroup, MG: curMonthGroup } }, "F");
        tStoreSeriesSG.data = tStoreSeriesSG.data.map(Number);
        cChartOne.addSeries(this._getStationGroupDescriptionsFromStation(curStationGroup), tStoreSeriesSG, {stroke: {color: new Color([0, 0, 0, 1.0]), style: "Dash", width: 6}});

        for (var i=0;i<curSeletectedStations.length;i++) {
            var tStoreSeriesCCS = new StoreSeries(storeDOWFactors, { query: { SG: curSeletectedStations[i], YG: curYearGroup, MG: curMonthGroup } }, "F");
            tStoreSeriesCCS.data = tStoreSeriesCCS.data.map(Number);
            cChartOne.addSeries(this._getStationDescriptionsFromStation(curSeletectedStations[i]), tStoreSeriesCCS, {stroke: {width: 1.5}});
        }

        cChartOne.title = "DOW Factors - " + curMonthGroup + " (" + curYearGroup + ")"
        dom.byId("dowtabletitle").innerHTML = "<p class=\"thicker\">" + curStationGroup + " DOW Factors - " + curMonthGroup + " (" + curYearGroup + ")</p>";

    } else if(curSeries=='YG') {
        for (var i=0;i<curYearGroup.length;i++) {
            var tStoreSeriesYG = new StoreSeries(storeDOWFactors, { query: { SG: curStationGroup, YG: curYearGroup[i], MG: curMonthGroup } }, "F");
            tStoreSeriesYG.data = tStoreSeriesYG.data.map(Number);
            if (curYearGroup[i] == defaultYearGroup) {
                cChartOne.addSeries(curYearGroup[i], tStoreSeriesYG, {stroke: {color: new Color([0, 0, 0, 1.0]), style: "Dash", width: 6}});
            } else {
                cChartOne.addSeries(curYearGroup[i], tStoreSeriesYG, {stroke: {width: 1.5}});
            }

        }

        cChartOne.title = "DOW Factors - " + curMonthGroup + " (" + curStationGroup + ")"
    }

    cChartOne.render();
    lLegendOne.refresh();
    
    //this.ShowAllOne();
    
    //if (curSeries=='SG') {
    //    this.FirstSeriesOne();
    //} else if (curSeries=='YG') {
    //    this.ShowAllOne();
    //}

    if (tStoreSeriesSG != undefined) {
        if(tStoreSeriesSG.data[0] != undefined) {
            dom.byId("01-Mon").innerHTML = tStoreSeriesSG.data[0].toFixed(3);
            dom.byId("02-Tue").innerHTML = tStoreSeriesSG.data[1].toFixed(3);
            dom.byId("03-Wed").innerHTML = tStoreSeriesSG.data[2].toFixed(3);
            dom.byId("04-Thu").innerHTML = tStoreSeriesSG.data[3].toFixed(3);
            dom.byId("05-Fri").innerHTML = tStoreSeriesSG.data[4].toFixed(3);
            dom.byId("06-Sat").innerHTML = tStoreSeriesSG.data[5].toFixed(3);
            dom.byId("07-Sun").innerHTML = tStoreSeriesSG.data[6].toFixed(3);
        }
    }
    
    var tStoreSeriesWDFactors = new StoreSeries(storeWDFactors, { query: { SG: curStationGroup, YG: curYearGroup, MG: curMonthGroup } }, "F");

    if (tStoreSeriesWDFactors.data[1]) {
        tStoreSeriesWDFactors.data = tStoreSeriesWDFactors.data.map(Number);
        dom.byId("W1-Tue-Thu").innerHTML = tStoreSeriesWDFactors.data[0].toFixed(3);
        dom.byId("W2-Sat-Sun").innerHTML = tStoreSeriesWDFactors.data[1].toFixed(3);
        dom.byId("MaxWkEnd").innerHTML = tStoreSeriesWDFactors.data[2].toFixed(3);
    }
    
    
    var sValue = "";

    //Remove existing series
    while( cChartTwo.series.length > 0 ) {
        cChartTwo.removeSeries(cChartTwo.series[0].name);
    }

    if (curSeries=='SG') {
        var tStoreSeriesMonthSG = new StoreSeries(storeMonthFactors, { query: { SG: curStationGroup, YG: curYearGroup } }, "F");
        tStoreSeriesMonthSG.data = tStoreSeriesMonthSG.data.map(Number);
        cChartTwo.addSeries(this._getStationGroupDescriptionsFromStation(curStationGroup), tStoreSeriesMonthSG, {stroke: {color: new Color([0, 0, 0, 1.0]), style: "Dash", width: 6}});

        for (var i=0;i<curSeletectedStations.length;i++) {
            var tStoreSeriesMonthCCS = new StoreSeries(storeMonthFactors, { query: { SG: curSeletectedStations[i], YG: curYearGroup} }, "F");
            tStoreSeriesMonthCCS.data = tStoreSeriesMonthCCS.data.map(Number);
            cChartTwo.addSeries(this._getStationDescriptionsFromStation(curSeletectedStations[i]), tStoreSeriesMonthCCS, {stroke: {width: 1.5}});
        }
        cChartTwo.title = "Month Factors (" + curYearGroup + ")"
        dom.byId("monthtabletitle").innerHTML = "<p class=\"thicker\">" + curStationGroup + " Month Factors (" + curYearGroup + ")</p>";

    } else if(curSeries=='YG') {

        for (var i=0;i<curYearGroup.length;i++) {
            var tStoreSeriesMonthYG = new StoreSeries(storeMonthFactors, { query: { SG: curStationGroup, YG: curYearGroup[i]} }, "F");
            tStoreSeriesMonthYG.data = tStoreSeriesMonthYG.data.map(Number);
            if (curYearGroup[i] == defaultYearGroup) {
                cChartTwo.addSeries(curYearGroup[i], tStoreSeriesMonthYG, {stroke: {color: new Color([0, 0, 0, 1.0]), style: "Dash", width: 6}});
            } else {
                cChartTwo.addSeries(curYearGroup[i], tStoreSeriesMonthYG, {stroke: {width: 1.5}});
            }
        }
        cChartTwo.title = "Month Factors (" + curStationGroup + ")"
    }

    cChartTwo.render();
    lLegendTwo.refresh();

    //this.ShowAllTwo();

    //if (curSeries=='SG') {
    //    this.FirstSeriesTwo();
    //} else if (curSeries=='YG') {
    //    this.ShowAllTwo();
    //}
    
    if (tStoreSeriesMonthSG != undefined) {
        if (tStoreSeriesMonthSG.data != undefined) {
            if (tStoreSeriesMonthSG.data.length==12) {
                dom.byId("Jan").innerHTML = tStoreSeriesMonthSG.data[ 0].toFixed(2);
                dom.byId("Feb").innerHTML = tStoreSeriesMonthSG.data[ 1].toFixed(2);
                dom.byId("Mar").innerHTML = tStoreSeriesMonthSG.data[ 2].toFixed(2);
                dom.byId("Apr").innerHTML = tStoreSeriesMonthSG.data[ 3].toFixed(2);
                dom.byId("May").innerHTML = tStoreSeriesMonthSG.data[ 4].toFixed(2);
                dom.byId("Jun").innerHTML = tStoreSeriesMonthSG.data[ 5].toFixed(2);
                dom.byId("Jul").innerHTML = tStoreSeriesMonthSG.data[ 6].toFixed(2);
                dom.byId("Aug").innerHTML = tStoreSeriesMonthSG.data[ 7].toFixed(2);
                dom.byId("Sep").innerHTML = tStoreSeriesMonthSG.data[ 8].toFixed(2);
                dom.byId("Oct").innerHTML = tStoreSeriesMonthSG.data[ 9].toFixed(2);
                dom.byId("Nov").innerHTML = tStoreSeriesMonthSG.data[10].toFixed(2);
                dom.byId("Dec").innerHTML = tStoreSeriesMonthSG.data[11].toFixed(2);
            }
        }
    }

    var tStoreSeriesSsnFactors = new StoreSeries(storeSsnFactors, { query: { SG: curStationGroup, YG: curYearGroup } }, "F");

    if (tStoreSeriesSsnFactors.data[1]) {
        tStoreSeriesSsnFactors.data = tStoreSeriesSsnFactors.data.map(Number);
        dom.byId("Winter" ).innerHTML = tStoreSeriesSsnFactors.data[0].toFixed(3);
        dom.byId("Spring" ).innerHTML = tStoreSeriesSsnFactors.data[1].toFixed(3);
        dom.byId("Summer" ).innerHTML = tStoreSeriesSsnFactors.data[2].toFixed(3);
        dom.byId("Fall"     ).innerHTML = tStoreSeriesSsnFactors.data[3].toFixed(3);
        dom.byId("Winter2").innerHTML = tStoreSeriesSsnFactors.data[0].toFixed(3);
    }

    this.ShowCCSForGroup();
},


_getStationDescriptionsFromStation: function(station) {

    _description = "";

    for (var i=0;i<stationGroupsCCSs.length;i++){
        if (stationGroupsCCSs[i].StationID==station) {
            _description=stationGroupsCCSs[i].StationName;
        }
    }
    return _description;
},

_getStationGroupDescriptionsFromStation: function(stationgroup) {

    _description = "";

    for (var i=0;i<stationGroups.length;i++){
        if (stationGroups[i].value==stationgroup) {
            _description=stationGroups[i].label;
        }
    }
    return _description;
},

_getStationGroupFacGeoGroup: function(stationgroup) {

    _facgeo = "";

    for (var i=0;i<stationGroups.length;i++){
        if (stationGroups[i].value==stationgroup) {
            _facgeo=stationGroups[i].FACGEOGROUP;
        }
    }
    return _facgeo;
},
FirstSeriesOne: function() {
    for (c=0;c<lLegendOne._cbs.length;c++) {
        if (c==0 && lLegendOne._cbs[c].checked == false) {
            dom.byId(lLegendOne._cbs[c].id).click();
        } else if (c>0 && lLegendOne._cbs[c].checked == true) {
            dom.byId(lLegendOne._cbs[c].id).click();
        }
    }
},

FirstSeriesTwo: function() {
    for (c=0;c<lLegendTwo._cbs.length;c++) {
        if (c==0 && lLegendTwo._cbs[c].checked == false) {
            dom.byId(lLegendTwo._cbs[c].id).click();
        } else if (c>0 && lLegendTwo._cbs[c].checked == true) {
            dom.byId(lLegendTwo._cbs[c].id).click();
        }
    }
},

ToggleOne: function() {
    for (c=0;c<lLegendOne._cbs.length;c++) {
        dom.byId(lLegendOne._cbs[c].id).click();
    }
},

ToggleTwo: function() {
    for (c=0;c<lLegendTwo._cbs.length;c++) {
        dom.byId(lLegendTwo._cbs[c].id).click();
    }
},

//ShowAllOne() {
//    for (c=0;c<lLegendOne._cbs.length;c++) {
//        if (lLegendOne._cbs[c].checked == false) {
//            dom.byId(lLegendOne._cbs[c].id).click();
//        }
//    }
//},
//
//ShowAllTwo() {
//    for (c=0;c<lLegendTwo._cbs.length;c++) {
//        if (lLegendTwo._cbs[c].checked == false) {
//            dom.byId(lLegendTwo._cbs[c].id).click();
//        }
//    }
//},
//
//HideAllOne() {
//    for (c=0;c<lLegendOne._cbs.length;c++) {
//        if (lLegendOne._cbs[c].checked == true) {
//            dom.byId(lLegendOne._cbs[c].id).click();
//        }
//    }
//    //if (curSeries=='SG') {
//    //    if (lLegendOne._cbs[0].checked == false) {
//    //        dom.byId(lLegendOne._cbs[0].id).click();
//    //    }
//    //}
//},
//
//HideAllTwo() {
//    for (c=0;c<lLegendTwo._cbs.length;c++) {
//        if (lLegendTwo._cbs[c].checked == true) {
//            dom.byId(lLegendTwo._cbs[c].id).click();
//        }
//    }
//    //if (curSeries=='SG') {
//    //    if (lLegendTwo._cbs[0].checked == false) {
//    //        dom.byId(lLegendTwo._cbs[0].id).click();
//    //    }
//    //}
//},


ShowHideAllOne: function() {
    
    var btnShowHideAll = dom.byId("showHideAllOne");

    if (btnShowHideAll.innerHTML == "Show All") {
        for (c=0;c<lLegendOne._cbs.length;c++) {
            if (lLegendOne._cbs[c].checked == false) {
                dom.byId(lLegendOne._cbs[c].id).click();
            }
        }
        btnShowHideAll.innerHTML = "Hide All";
    } else if (btnShowHideAll.innerHTML == "Hide All") {
        for (c=0;c<lLegendOne._cbs.length;c++) {
            if (lLegendOne._cbs[c].checked == true) {
                dom.byId(lLegendOne._cbs[c].id).click();
            }
        }
        btnShowHideAll.innerHTML = "Show All";
    }
},

ShowHideAllTwo: function(){
    
    var btnShowHideAll = dom.byId("showHideAllTwo");

    if (btnShowHideAll.innerHTML == "Show All") {
        for (c=0;c<lLegendTwo._cbs.length;c++) {
            if (lLegendTwo._cbs[c].checked == false) {
                dom.byId(lLegendTwo._cbs[c].id).click();
            }
        }
        btnShowHideAll.innerHTML = "Hide All";
    } else if (btnShowHideAll.innerHTML == "Hide All") {
        for (c=0;c<lLegendTwo._cbs.length;c++) {
            if (lLegendTwo._cbs[c].checked == true) {
                dom.byId(lLegendTwo._cbs[c].id).click();
            }
        }
        btnShowHideAll.innerHTML = "Show All";
    }
},

//added from Demo widget Setting.js
setConfig: function(config){
    //this.textNode.value = config.districtfrom;
var test = "";
},

getConfigFrom: function(){
    //WAB will get config object through this method
    return {
        //districtfrom: this.textNode.value
    };
}

});
});