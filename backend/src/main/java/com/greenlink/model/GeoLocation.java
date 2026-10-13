package com.greenlink.model;

import org.springframework.data.mongodb.core.geo.GeoJsonPoint;

public class GeoLocation {
    private String type = "Point";
    private double[] coordinates = new double[]{0,0};
    public GeoLocation() {}
    public GeoLocation(double lng, double lat) { this.coordinates = new double[]{lng, lat}; }
    public String getType(){return type;} public void setType(String type){this.type=type;}
    public double[] getCoordinates(){return coordinates;} public void setCoordinates(double[] c){this.coordinates=c;}
    public GeoJsonPoint point(){ return new GeoJsonPoint(coordinates[0], coordinates[1]); }
}
