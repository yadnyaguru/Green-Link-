package com.greenlink.model;

import java.time.Instant;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.*;
import org.springframework.data.mongodb.core.index.GeoSpatialIndexType;
import org.springframework.data.mongodb.core.index.GeoSpatialIndexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Document("listings")
public class Listing {
    @Id private ObjectId id;
    private ObjectId provider;
    private ObjectId plant;
    private double price;
    private int quantity = 1;
    private String address = "";
    private String description="";
    private boolean availability=true;
    @GeoSpatialIndexed(name = "location_2dsphere", type = GeoSpatialIndexType.GEO_2DSPHERE) private GeoLocation location;
    @CreatedDate private Instant createdAt;
    @LastModifiedDate private Instant updatedAt;
    public ObjectId getId(){return id;} public void setId(ObjectId v){id=v;}
    public ObjectId getProvider(){return provider;} public void setProvider(ObjectId v){provider=v;}
    public ObjectId getPlant(){return plant;} public void setPlant(ObjectId v){plant=v;}
    public double getPrice(){return price;} public void setPrice(double v){price=v;}
    public int getQuantity(){return quantity;} public void setQuantity(int v){quantity=v;}
    public String getAddress(){return address;} public void setAddress(String v){address=v;}
    public String getDescription(){return description;} public void setDescription(String v){description=v;}
    public boolean isAvailability(){return availability;} public void setAvailability(boolean v){availability=v;}
    public GeoLocation getLocation(){return location;} public void setLocation(GeoLocation v){location=v;}
    public Instant getCreatedAt(){return createdAt;} public void setCreatedAt(Instant v){createdAt=v;}
    public Instant getUpdatedAt(){return updatedAt;} public void setUpdatedAt(Instant v){updatedAt=v;}
}
