package com.greenlink.model;

import java.time.Instant;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.GeoSpatialIndexType;
import org.springframework.data.mongodb.core.index.GeoSpatialIndexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Document("users")
public class User {
    @Id private ObjectId id;
    private String name;
    private String email;
    private String password;
    private boolean isProvider;
    private String profileImage = "";
    private String profileImagePublicId = "";
    @GeoSpatialIndexed(name = "location_2dsphere", type = GeoSpatialIndexType.GEO_2DSPHERE) private GeoLocation location = new GeoLocation();
    @CreatedDate private Instant createdAt;
    @LastModifiedDate private Instant updatedAt;
    public ObjectId getId(){return id;} public void setId(ObjectId id){this.id=id;}
    public String getName(){return name;} public void setName(String v){name=v;}
    public String getEmail(){return email;} public void setEmail(String v){email=v;}
    public String getPassword(){return password;} public void setPassword(String v){password=v;}
    public boolean isProvider(){return isProvider;} public void setProvider(boolean v){isProvider=v;}
    public String getProfileImage(){return profileImage;} public void setProfileImage(String v){profileImage=v;}
    public String getProfileImagePublicId(){return profileImagePublicId;} public void setProfileImagePublicId(String v){profileImagePublicId=v;}
    public GeoLocation getLocation(){return location;} public void setLocation(GeoLocation v){location=v;}
    public Instant getCreatedAt(){return createdAt;} public void setCreatedAt(Instant v){createdAt=v;}
    public Instant getUpdatedAt(){return updatedAt;} public void setUpdatedAt(Instant v){updatedAt=v;}
}
