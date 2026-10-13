package com.greenlink.service;

import com.greenlink.dto.MessageView;
import com.greenlink.dto.UserView;
import com.greenlink.model.Message;
import com.greenlink.model.Request;
import com.greenlink.repository.MessageRepository;
import com.greenlink.util.IdUtil;
import java.util.List;
import org.bson.types.ObjectId;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

@Service
public class MessageService {

    private final MessageRepository repo;
    private final RequestService requests;
    private final UserService users;

    public MessageService(MessageRepository r, RequestService q, UserService u) {
        repo = r;
        requests = q;
        users = u;
    }

    public MessageView send(ObjectId uid, String requestId, String content) {
        if (content == null || content.trim().isEmpty())
            throw new IllegalArgumentException("Message cannot be empty");
        if (requestId == null || requestId.isBlank())
            throw new IllegalArgumentException("Request ID is required");

        Request r = requests.require(IdUtil.oid(requestId));
        if (!requests.participant(r, uid))
            throw new AccessDeniedException("Not authorized");

        Message m = new Message();
        m.setRequest(r.getId());
        m.setSender(uid);
        m.setContent(content.trim());
        repo.save(m);
        return view(m);
    }

    public List<MessageView> history(ObjectId uid, ObjectId rid) {
        Request r = requests.require(rid);
        if (!requests.participant(r, uid))
            throw new AccessDeniedException("Not authorized");
        return repo.findByRequestOrderByCreatedAtAsc(rid).stream().map(this::view).toList();
    }

    private MessageView view(Message m) {
        UserView sender = null;
        if (m.getSender() != null) {
            try {
                sender = users.publicView(m.getSender());
            } catch (Exception ignored) {}
        }
        String reqId = m.getRequest() != null ? m.getRequest().toHexString() : "";
        return new MessageView(
                m.getId().toHexString(),
                reqId,
                sender,
                m.getContent(),
                m.getCreatedAt(),
                m.getUpdatedAt()
        );
    }
}
