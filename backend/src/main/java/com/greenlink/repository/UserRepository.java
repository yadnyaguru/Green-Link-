package com.greenlink.repository; import com.greenlink.model.User; import java.util.Optional; import org.bson.types.ObjectId; import org.springframework.data.mongodb.repository.MongoRepository;
public interface UserRepository extends MongoRepository<User,ObjectId>{Optional<User> findByEmail(String email); long countByIsProviderTrue();}
