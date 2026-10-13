package com.greenlink.repository; import com.greenlink.model.Message; import java.util.List; import org.bson.types.ObjectId; import org.springframework.data.mongodb.repository.MongoRepository;
public interface MessageRepository extends MongoRepository<Message,ObjectId>{List<Message> findByRequestOrderByCreatedAtAsc(ObjectId requestId);}
