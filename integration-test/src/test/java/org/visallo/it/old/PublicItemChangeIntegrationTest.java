package org.visallo.it.old;

import com.google.common.base.Predicate;
import com.google.common.collect.Collections2;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.runners.MockitoJUnitRunner;
import org.visallo.web.clientapi.VisalloApi;
import org.visallo.web.clientapi.VisalloClientApiException;
import org.visallo.web.clientapi.model.*;

import java.util.List;

import static org.junit.Assert.*;

//@RunWith(MockitoJUnitRunner.class)
public class PublicItemChangeIntegrationTest extends TestBase {
//    private ClientApiElement e1;
//    private ClientApiElement v1;
//    private ClientApiElement v2;
//
//    @Test
//    public void testPublicItemChanges() throws VisalloClientApiException {
//        createUsers();
//        createTestGraph();
//        testDeleteProperty();
//        testDeleteEdge();
//        testDeleteVertex();
//    }
//
//    private void createUsers() throws VisalloClientApiException {
//        VisalloApi visalloApi = login(USERNAME_TEST_USER_1);
//        addUserAuths(visalloApi, USERNAME_TEST_USER_1, "auth1");
//        visalloApi.logout();
//
//        visalloApi = login(USERNAME_TEST_USER_2);
//        addUserAuths(visalloApi, USERNAME_TEST_USER_2, "auth1");
//        visalloApi.logout();
//    }
//
//    private void createTestGraph() throws VisalloClientApiException {
//        VisalloApi visalloApi = login(USERNAME_TEST_USER_1);
//        addUserAuths(visalloApi, USERNAME_TEST_USER_1, "auth1");
//
//        v1 = visalloApi.getVertex().postNew(null, TestOntology.CONCEPT_PERSON, "auth1", null, "justification");
//        visalloApi.getVertex().postProperty(v1.getId(), TestOntology.PROPERTY_NAME, "key1", "Joe", null, "auth1", null, null, null, "test");
//
//        v2 = visalloApi.getVertex().postNew(null, TestOntology.CONCEPT_PERSON, "auth1", null, "justification");
//
//        e1 = visalloApi.getEdge().postCreate(v1.getId(), v2.getId(), TestOntology.EDGE_LABEL_WORKS_FOR, "auth1", "test", null);
//
//        List<ClientApiWorkspaceDiff.Item> diffItems = visalloApi.getWorkspace().getDiff().getDiffs();
//        visalloApi.getWorkspace().postPublishAll(diffItems);
//
//        visalloApi.logout();
//
//        visalloApi = login(USERNAME_TEST_USER_2);
//
//        // add vertices to workspace
//        ClientApiWorkspaceUpdateData updateData = new ClientApiWorkspaceUpdateData();
//        updateData.getEntityUpdates().add(new ClientApiWorkspaceUpdateData.EntityUpdate(v1.getId(), new GraphPosition(0, 0)));
//        updateData.getEntityUpdates().add(new ClientApiWorkspaceUpdateData.EntityUpdate(v2.getId(), new GraphPosition(0, 0)));
//        visalloApi.getWorkspace().postUpdate(updateData);
//
//        visalloApi.logout();
//    }
//
//    private void testDeleteProperty() throws VisalloClientApiException {
//        VisalloApi visalloApi = login(USERNAME_TEST_USER_2);
//
//        // delete the property
//        visalloApi.getVertex().deleteProperty(v1.getId(), "key1", TestOntology.PROPERTY_NAME);
//
//        // verify the diff
//        List<ClientApiWorkspaceDiff.Item> diffItems = visalloApi.getWorkspace().getDiff().getDiffs();
//        assertEquals(1, diffItems.size());
//        assertTrue("wrong diff type: " + diffItems.get(0).getClass().getName(), diffItems.get(0) instanceof ClientApiWorkspaceDiff.PropertyItem);
//        ClientApiWorkspaceDiff.PropertyItem pi = (ClientApiWorkspaceDiff.PropertyItem) diffItems.get(0);
//        assertEquals("key1", pi.getKey());
//        assertEquals(TestOntology.PROPERTY_NAME, pi.getName());
//        assertTrue("is deleted", pi.isDeleted());
//        assertEquals("((auth1))|visallo", pi.getVisibilityString());
//
//        // publish the delete
//        ClientApiWorkspacePublishResponse publishResponse = visalloApi.getWorkspace().postPublishAll(diffItems);
//        assertTrue("publish not success", publishResponse.isSuccess());
//        assertEquals(0, publishResponse.getFailures().size());
//
//        visalloApi.logout();
//
//        // verify all users see the delete
//        visalloApi = login(USERNAME_TEST_USER_1);
//
//        ClientApiElement v1WithoutProperty = visalloApi.getVertex().getProperties(v1.getId());
//        assertEquals(2, v1WithoutProperty.getProperties().size());
//        assertEquals(0, Collections2.filter(v1WithoutProperty.getProperties(), new Predicate<ClientApiProperty>() {
//            @Override
//            public boolean apply(ClientApiProperty prop) {
//                return prop.getKey().equals("key1") && prop.getName().equals(TestOntology.PROPERTY_NAME);
//            }
//        }).size());
//
//        visalloApi.logout();
//    }
//
//    private void testDeleteEdge() throws VisalloClientApiException {
//        VisalloApi visalloApi = login(USERNAME_TEST_USER_2);
//
//        // delete the edge
//        visalloApi.getEdge().delete(e1.getId());
//
//        // verify the diff
//        List<ClientApiWorkspaceDiff.Item> diffItems = visalloApi.getWorkspace().getDiff().getDiffs();
//        assertEquals(1, diffItems.size());
//        assertTrue("wrong diff type: " + diffItems.get(0).getClass().getName(), diffItems.get(0) instanceof ClientApiWorkspaceDiff.EdgeItem);
//        ClientApiWorkspaceDiff.EdgeItem ei = (ClientApiWorkspaceDiff.EdgeItem) diffItems.get(0);
//        assertEquals(e1.getId(), ei.getEdgeId());
//        assertTrue("is deleted", ei.isDeleted());
//        assertEquals(TestOntology.EDGE_LABEL_WORKS_FOR, ei.getLabel());
//
//        // publish the delete
//        ClientApiWorkspacePublishResponse publishResponse = visalloApi.getWorkspace().postPublishAll(diffItems);
//        assertTrue("publish not success", publishResponse.isSuccess());
//        assertEquals(0, publishResponse.getFailures().size());
//
//        visalloApi.logout();
//
//        // verify all users see the delete
//        visalloApi = login(USERNAME_TEST_USER_1);
//
//        ClientApiVertexEdges edges = visalloApi.getVertex().getEdges(v1.getId());
//        assertEquals(0, edges.getRelationships().size());
//
//        visalloApi.logout();
//    }
//
//    private void testDeleteVertex() throws VisalloClientApiException {
//        VisalloApi visalloApi = login(USERNAME_TEST_USER_2);
//
//        // delete the vertex
//        visalloApi.getVertex().delete(v1.getId());
//
//        // verify the diff
//        List<ClientApiWorkspaceDiff.Item> diffItems = visalloApi.getWorkspace().getDiff().getDiffs();
//        assertEquals(1, diffItems.size());
//        assertTrue("wrong diff type: " + diffItems.get(0).getClass().getName(), diffItems.get(0) instanceof ClientApiWorkspaceDiff.VertexItem);
//        ClientApiWorkspaceDiff.VertexItem vi = (ClientApiWorkspaceDiff.VertexItem) diffItems.get(0);
//        assertEquals(v1.getId(), vi.getVertexId());
//        assertTrue("is deleted", vi.isDeleted());
//
//        // publish the delete
//        ClientApiWorkspacePublishResponse publishResponse = visalloApi.getWorkspace().postPublishAll(diffItems);
//        assertTrue("publish not success", publishResponse.isSuccess());
//        assertEquals(0, publishResponse.getFailures().size());
//
//        visalloApi.logout();
//
//        // verify all users see the delete
//        visalloApi = login(USERNAME_TEST_USER_1);
//
//        ClientApiElement v = visalloApi.getVertex().getProperties(v1.getId());
//        assertNull("vertex should not have been found", v);
//
//        visalloApi.logout();
//    }
}
