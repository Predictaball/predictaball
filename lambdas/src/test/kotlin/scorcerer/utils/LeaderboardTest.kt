package scorcerer.utils

import aws.sdk.kotlin.services.s3.S3Client
import aws.sdk.kotlin.services.s3.model.*
import aws.smithy.kotlin.runtime.content.decodeToString
import io.kotest.matchers.shouldBe
import io.mockk.*
import kotlinx.coroutines.runBlocking
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.openapitools.server.models.LeaderboardInner
import org.openapitools.server.models.User
import scorcerer.server.toJson

class TestLeaderboardS3Service {
    private lateinit var s3Client: S3Client
    private lateinit var leaderboardS3Service: LeaderboardS3Service
    private val s3BucketName = "test-bucket"

    @BeforeEach
    fun setUp() {
        s3Client = mockk()
        leaderboardS3Service = LeaderboardS3Service(s3Client, s3BucketName)
    }

    @Test
    fun writeLeaderboardShouldCallPutObjectWithCorrectParameters(): Unit = runBlocking {
        val leaderboard = listOf(
            LeaderboardInner(1, User("name", "secondName1", "user1", 3, 3, 3, 10, 5), LeaderboardInner.Movement.IMPROVED),
            LeaderboardInner(1, User("name", "secondName2", "user2", 3, 3, 3, 10, 5), LeaderboardInner.Movement.IMPROVED),
        )

        val expectedKey = "matchDay1.json"
        val expectedBody = leaderboard.toJson()

        coEvery { s3Client.putObject(any<PutObjectRequest>()) } returns mockk()
        val putObjectRequestSlot = slot<PutObjectRequest>()

        leaderboardS3Service.writeLeaderboard(leaderboard, 1)

        coVerify {
            s3Client.putObject(
                capture(putObjectRequestSlot),
            )
        }
        val capturedRequest = putObjectRequestSlot.captured
        capturedRequest.bucket shouldBe s3BucketName
        capturedRequest.key shouldBe expectedKey
        val capturedBody = capturedRequest.body?.decodeToString()
        capturedBody shouldBe expectedBody
    }

    @Test
    fun testGetLatestLeaderboardMatchDayGivenItemsInBucket() {
        runBlocking {
            val s3Objects = listOf(
                Object { key = "matchDay1.json" },
                Object { key = "matchDay2.json" },
                Object { key = "matchDay3.json" },
            )
            val listResponse = ListObjectsV2Response {
                contents = s3Objects
            }

            coEvery { s3Client.listObjectsV2(any<ListObjectsV2Request>()) } returns listResponse

            val latestMatchDay = leaderboardS3Service.getLatestLeaderboardMatchDay()

            latestMatchDay shouldBe 3
            coVerify { s3Client.listObjectsV2(any<ListObjectsV2Request>()) }
        }
    }

    @Test
    fun testGetLatestLeaderboardMatchDayGivenNothingInBucket() {
        runBlocking {
            val s3Objects = emptyList<Object>()
            val listResponse = ListObjectsV2Response {
                contents = s3Objects
            }

            coEvery { s3Client.listObjectsV2(any<ListObjectsV2Request>()) } returns listResponse

            val latestMatchDay = leaderboardS3Service.getLatestLeaderboardMatchDay()

            latestMatchDay shouldBe 0
            coVerify { s3Client.listObjectsV2(any<ListObjectsV2Request>()) }
        }
    }

    @Test
    fun getLeaderboardShouldReturnLeaderboardForAValidMatchDay() = runBlocking {
        val matchDay = 1
        val exception = RuntimeException("Some S3 error")

        coEvery {
            s3Client.getObject(
                any<GetObjectRequest>(),
                any<suspend (GetObjectResponse) -> List<LeaderboardInner>?>(),
            )
        } throws exception

        val result = leaderboardS3Service.getLeaderboard(matchDay)

        result shouldBe null
        coVerify { s3Client.getObject(any<GetObjectRequest>(), any()) }
    }

    // Regression: getLeaderboard(N-1) for movement calculation used to evict
    // the latest-matchDay cache, so the next call to getLatestLeaderboardMatchDay
    // returned N-1 forever (until process restart).
    @Test
    fun getLeaderboardForPreviousDayDoesNotCorruptLatestMatchDayCache(): Unit = runBlocking {
        val s3Objects = listOf(
            Object { key = "matchDay0.json" },
            Object { key = "matchDay1.json" },
        )
        coEvery { s3Client.listObjectsV2(any<ListObjectsV2Request>()) } returns ListObjectsV2Response { contents = s3Objects }
        // Invoke the captured lambda so the side effects of the production
        // code (which write to the cache fields) actually run.
        val mockResp = mockk<GetObjectResponse> {
            every { body } returns aws.smithy.kotlin.runtime.content.ByteStream.fromString(emptyList<LeaderboardInner>().toJson())
        }
        coEvery {
            s3Client.getObject(any<GetObjectRequest>(), any<suspend (GetObjectResponse) -> List<LeaderboardInner>?>())
        } coAnswers {
            val block = secondArg<suspend (GetObjectResponse) -> List<LeaderboardInner>?>()
            block(mockResp)
        }

        leaderboardS3Service.getLatestLeaderboardMatchDay() shouldBe 1
        leaderboardS3Service.getLeaderboard(0)
        // Old buggy code wrote cachedMatchDay=0 inside getLeaderboard's success
        // path, so this returned 0. New code keeps the two caches separate.
        leaderboardS3Service.getLatestLeaderboardMatchDay() shouldBe 1
    }

    @Test
    fun writeLeaderboardAdvancesLatestMatchDay(): Unit = runBlocking {
        coEvery { s3Client.putObject(any<PutObjectRequest>()) } returns mockk()
        coEvery { s3Client.listObjectsV2(any<ListObjectsV2Request>()) } returns ListObjectsV2Response {
            contents = emptyList()
        }

        // Cache the (empty) latest first.
        leaderboardS3Service.getLatestLeaderboardMatchDay() shouldBe 0
        // Writing matchDay 1 should bump the cached latest forward without
        // re-listing S3.
        leaderboardS3Service.writeLeaderboard(emptyList(), 1)
        leaderboardS3Service.getLatestLeaderboardMatchDay() shouldBe 1
    }
}

class LeaderboardTest {
    @Test
    fun testFilterLeaderboardToLeague() {
        val globalLeagueLeaderboard = listOf(
            LeaderboardInner(1, User("name", "secondName5", "user5", 3, 3, 3, 10, 5), LeaderboardInner.Movement.IMPROVED),
            LeaderboardInner(2, User("name", "secondName3", "user3", 3, 3, 3, 5, 7), LeaderboardInner.Movement.IMPROVED),
            LeaderboardInner(3, User("name", "secondName1", "user1", 3, 3, 3, 5, 5), LeaderboardInner.Movement.UNCHANGED),
            LeaderboardInner(3, User("name", "secondName4", "user4", 3, 3, 3, 5, 5), LeaderboardInner.Movement.IMPROVED),
            LeaderboardInner(5, User("name", "secondName2", "user2", 3, 3, 3, 3, 4), LeaderboardInner.Movement.WORSENED),
        )

        val leagueUserIds = listOf("user1", "user2", "user4", "user5")

        val filteredLeaderboard = filterLeaderboardToLeague(globalLeagueLeaderboard, leagueUserIds)
        filteredLeaderboard shouldBe listOf(
            LeaderboardInner(1, User("name", "secondName5", "user5", 3, 3, 3, 10, 5), LeaderboardInner.Movement.IMPROVED),
            LeaderboardInner(2, User("name", "secondName1", "user1", 3, 3, 3, 5, 5), LeaderboardInner.Movement.UNCHANGED),
            LeaderboardInner(2, User("name", "secondName4", "user4", 3, 3, 3, 5, 5), LeaderboardInner.Movement.IMPROVED),
            LeaderboardInner(4, User("name", "secondName2", "user2", 3, 3, 3, 3, 4), LeaderboardInner.Movement.WORSENED),
        )
    }

    @Test
    fun testCalculateMovement() {
        val previousLeaderboard = listOf(
            LeaderboardInner(1, User("name", "secondName5", "user5", 3, 3, 3, 10, 5), LeaderboardInner.Movement.UNCHANGED),
            LeaderboardInner(2, User("name", "secondName3", "user3", 3, 3, 3, 5, 7), LeaderboardInner.Movement.UNCHANGED),
            LeaderboardInner(3, User("name", "secondName1", "user1", 3, 3, 3, 5, 5), LeaderboardInner.Movement.UNCHANGED),
            LeaderboardInner(3, User("name", "secondName4", "user4", 3, 3, 3, 5, 5), LeaderboardInner.Movement.UNCHANGED),
        )

        val leaderboard = listOf(
            LeaderboardInner(1, User("name", "secondName1", "user1", 3, 3, 3, 5, 5), LeaderboardInner.Movement.UNCHANGED),
            LeaderboardInner(1, User("name", "secondName4", "user4", 3, 3, 3, 5, 5), LeaderboardInner.Movement.UNCHANGED),
            LeaderboardInner(3, User("name", "secondName3", "user3", 3, 3, 3, 5, 7), LeaderboardInner.Movement.UNCHANGED),
            LeaderboardInner(4, User("name", "secondName5", "user5", 3, 3, 3, 10, 5), LeaderboardInner.Movement.UNCHANGED),
            LeaderboardInner(5, User("name", "secondName2", "user2", 3, 3, 3, 0, 0), LeaderboardInner.Movement.UNCHANGED),
        )

        val leaderboardWithMovementRecalculated = calculateMovement(leaderboard, previousLeaderboard)
        leaderboardWithMovementRecalculated shouldBe listOf(
            LeaderboardInner(1, User("name", "secondName1", "user1", 3, 3, 3, 5, 5), LeaderboardInner.Movement.IMPROVED),
            LeaderboardInner(1, User("name", "secondName4", "user4", 3, 3, 3, 5, 5), LeaderboardInner.Movement.IMPROVED),
            LeaderboardInner(3, User("name", "secondName3", "user3", 3, 3, 3, 5, 7), LeaderboardInner.Movement.WORSENED),
            LeaderboardInner(4, User("name", "secondName5", "user5", 3, 3, 3, 10, 5), LeaderboardInner.Movement.WORSENED),
            LeaderboardInner(5, User("name", "secondName2", "user2", 3, 3, 3, 0, 0), LeaderboardInner.Movement.UNCHANGED),
        )
    }
}
