package com.greenlink.model;

import java.time.Instant;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.*;
import org.springframework.data.mongodb.core.mapping.Document;

@Document("requests")
public class Request {
    @Id private ObjectId id;
    private ObjectId listing;
    private ObjectId requester;
    private ObjectId provider;
    private String status="pending";
    private String message="";
    private int quantity = 1;
    private double totalPrice = 0.0;
    @CreatedDate private Instant createdAt;
    @LastModifiedDate private Instant updatedAt;
    public ObjectId getId(){return id;} public void setId(ObjectId v){id=v;}
    public ObjectId getListing(){return listing;} public void setListing(ObjectId v){listing=v;}
    public ObjectId getRequester(){return requester;} public void setRequester(ObjectId v){requester=v;}
    public ObjectId getProvider(){return provider;} public void setProvider(ObjectId v){provider=v;}
    public String getStatus(){return status;} public void setStatus(String v){status=v;}
    public String getMessage(){return message;} public void setMessage(String v){message=v;}
    public int getQuantity(){return quantity;} public void setQuantity(int v){quantity=v;}
    public double getTotalPrice(){return totalPrice;} public void setTotalPrice(double v){totalPrice=v;}
    public Instant getCreatedAt(){return createdAt;} public void setCreatedAt(Instant v){createdAt=v;}
    public Instant getUpdatedAt(){return updatedAt;} public void setUpdatedAt(Instant v){updatedAt=v;}
}
