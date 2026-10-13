package com.greenlink.model;

import java.time.Instant;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.*;
import org.springframework.data.mongodb.core.mapping.Document;

@Document("plants")
public class Plant {
    @Id private ObjectId id;
    private String name;
    private String scientificName = "";
    private String description = "";
    private String careInstructions = "";
    private String image = "";
    private String imagePublicId = "";
    private ObjectId addedBy;
    @CreatedDate private Instant createdAt;
    @LastModifiedDate private Instant updatedAt;
    public ObjectId getId(){return id;} public void setId(ObjectId v){id=v;}
    public String getName(){return name;} public void setName(String v){name=v;}
    public String getScientificName(){return scientificName;} public void setScientificName(String v){scientificName=v;}
    public String getDescription(){return description;} public void setDescription(String v){description=v;}
    public String getCareInstructions(){return careInstructions;} public void setCareInstructions(String v){careInstructions=v;}
    public String getImage(){return image;} public void setImage(String v){image=v;}
    public String getImagePublicId(){return imagePublicId;} public void setImagePublicId(String v){imagePublicId=v;}
    public ObjectId getAddedBy(){return addedBy;} public void setAddedBy(ObjectId v){addedBy=v;}
    public Instant getCreatedAt(){return createdAt;} public void setCreatedAt(Instant v){createdAt=v;}
    public Instant getUpdatedAt(){return updatedAt;} public void setUpdatedAt(Instant v){updatedAt=v;}
}
