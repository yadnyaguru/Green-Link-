package com.greenlink.dto; import java.time.Instant; public record MessageView(String _id,String request,UserView sender,String content,Instant createdAt,Instant updatedAt){}
