package com.greenlink.repository; import com.greenlink.model.Rating; import java.util.List; import org.bson.types.ObjectId; import org.springframework.data.mongodb.repository.MongoRepository;
public interface RatingRepository extends MongoRepository<Rating,ObjectId>{List<Rating> findByProviderOrderByCreatedAtDesc(ObjectId provider); long countByProvider(ObjectId provider);}
