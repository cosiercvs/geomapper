import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Alert,
  BackHandler,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import { useLocalSearchParams, useRouter } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import icons from "@/constants/icons";
import { useFocusEffect } from "@react-navigation/native";

const CatchDetails = () => {
  const router = useRouter();
  const { latitude, longitude, description } = useLocalSearchParams();

  // Convert latitude and longitude to numbers
  const lat = parseFloat(latitude as string);
  const lon = parseFloat(longitude as string);

  // State to manage the focus of the TextInputs
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  // State for date and time pickers
  const [dayCaught, setDayCaught] = useState(new Date());
  const [timeCaught, setTimeCaught] = useState(new Date());
  const [isDayPickerVisible, setDayPickerVisible] = useState(false);
  const [isTimePickerVisible, setTimePickerVisible] = useState(false);
  const [fishName, setFishName] = useState<string>("");
  const [fishWeight, setFishWeight] = useState<string>("");
  const [fishLength, setFishLength] = useState<string>("");

  // State for loading spinner
  const [loading, setLoading] = useState(false);

  // Handle date and time changes
  const onChangeDate = (event: any, selectedDate: Date | undefined) => {
    const currentDate = selectedDate || dayCaught;
    setDayPickerVisible(Platform.OS === "ios");
    setDayCaught(currentDate);
  };

  const onChangeTime = (event: any, selectedTime: Date | undefined) => {
    const currentTime = selectedTime || timeCaught;
    setTimePickerVisible(Platform.OS === "ios");
    setTimeCaught(currentTime);
  };

  const { documentId } = useLocalSearchParams() as { documentId: string };

  if (!documentId) {
    console.error("Document ID is undefined");
    return;
  }

  // Function to save catch details
  const handleSaveCatchDetails = async () => {
    const db = getFirestore();
    const auth = getAuth();
    const docRef = doc(db, "log_catch", documentId);

    setLoading(true);
    try {
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        await updateDoc(docRef, {
          fishName,
          fishWeight,
          fishLength,
          dayCaught: dayCaught.toISOString().split("T")[0],
          timeCaught: timeCaught.toISOString().split("T")[1],
        });
      } else {
        console.error("Document does not exist!");
      }

      Alert.alert("Success", "Catch details updated successfully!");
      router.push("/profile");
    } catch (error) {
      console.error("Error updating catch details:", error);
      Alert.alert("Error", "Failed to update catch details.");
    } finally {
      setLoading(false);
    }
  };

  const handleMapPress = () => {
    router.push({
      pathname: "/navigate-location",
      params: {
        latitude: lat.toString(),
        longitude: lon.toString(),
        description: description?.toString(),
      },
    });
  };

  // Function to handle document deletion
  const handleDeleteDocument = async () => {
    const db = getFirestore();
    const docRef = doc(db, "log_catch", documentId);

    setLoading(true);
    try {
      await deleteDoc(docRef);
      router.push("/navigate-location");
    } catch (error) {
      console.error("Error deleting document:", error);
    } finally {
      setLoading(false);
    }
  };

  // Function to handle back button press
  const handleBackPress = () => {
    Alert.alert(
      "Discard Details?",
      "Are you sure you want to discard the details?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Discard",
          onPress: () => {
            handleDeleteDocument(); 
          },
        },
      ]
    );
    return true; 
  };

  useFocusEffect(
    useCallback(() => {
      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        handleBackPress
      );

      return () => backHandler.remove();
    }, [])
  );

  return (
    <SafeAreaView className="bg-white flex-1">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
      >
        <View className="h-[200px] overflow-hidden">
          <MapView
            style={styles.map}
            mapType="hybrid"
            initialRegion={{
              latitude: lat,
              longitude: lon,
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0421,
            }}
            zoomEnabled={false}
            scrollEnabled={false}
            onPress={handleMapPress}
          >
            <Marker
              coordinate={{ latitude: lat, longitude: lon }}
              title="Fishing Spot"
              description={description?.toString() || ""}
            />
          </MapView>
          <TouchableOpacity style={styles.editIcon} onPress={handleMapPress}>
            <Image source={icons.edit} style={{ width: 24, height: 24 }} />
          </TouchableOpacity>
        </View>

        <View style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
          <View>
            <Text className="text-sm font-pregular">Fishing spot location</Text>
            <TextInput
              value={description?.toString()}
              placeholder="Enter description here"
              placeholderTextColor="#ddd"
              editable={false}
              className={`text-black font-psemibold text-xl px-1 py-2 border-b ${
                focusedInput === "description"
                  ? "border-blue-800"
                  : "border-gray-300"
              }`}
              onFocus={() => setFocusedInput("description")}
              onBlur={() => setFocusedInput(null)}
            />
          </View>

          <View className="mt-10 mb-24">
            <Text className="text-xl text-black font-pbold mt-2">
              Specify species
            </Text>
            <View className="mt-3">
              <View>
                <Text className="text-sm font-pregular">Fish Name</Text>
                <TextInput
                  placeholder="Enter fish name"
                  placeholderTextColor="#ddd"
                  value={fishName}
                  onChangeText={setFishName} 
                  className={`text-black font-pmedium text-md px-1 py-2 border-b ${
                    focusedInput === "fishName"
                      ? "border-blue-800"
                      : "border-gray-300"
                  }`}
                  onFocus={() => setFocusedInput("fishName")}
                  onBlur={() => setFocusedInput(null)}
                />
              </View>
              <View className="flex-row justify-center space-x-3 mt-5">
                <TextInput
                  placeholder="Fish Weight"
                  placeholderTextColor="#262626"
                  className={`text-black font-pmedium text-md px-6 py-4 border rounded-md ${
                    focusedInput === "weight"
                      ? "border-blue-800"
                      : "border-gray-300"
                  }`}
                  style={styles.input}
                  onChangeText={setFishWeight}
                  onFocus={() => setFocusedInput("weight")}
                  onBlur={() => setFocusedInput(null)}
                  multiline={false}
                  numberOfLines={1}
                  keyboardType="numeric"
                />
                <TextInput
                  placeholder="Fish Length"
                  placeholderTextColor="#262626"
                  className={`text-black font-pmedium text-md px-6 py-4 border rounded-md ${
                    focusedInput === "length"
                      ? "border-blue-800"
                      : "border-gray-300"
                  }`}
                  style={styles.input}
                  onChangeText={setFishLength}
                  onFocus={() => setFocusedInput("length")}
                  onBlur={() => setFocusedInput(null)}
                  multiline={false}
                  numberOfLines={1}
                  keyboardType="numeric" 
                />
              </View>

              <View className="flex-row justify-center space-x-3">
                <TouchableOpacity
                  className="mt-5 text-black font-pmedium text-md px-6 py-4 border border-gray-300 rounded-md"
                  onPress={() => setDayPickerVisible(true)}
                >
                  <View>
                    <Text className="text-sm font-pregular">Day caught</Text>
                    <Text className="text-lg font-pbold">
                      {dayCaught.toDateString()}
                    </Text>
                  </View>
                  {isDayPickerVisible && (
                    <DateTimePicker
                      value={dayCaught}
                      mode="date"
                      display="default"
                      onChange={onChangeDate}
                    />
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  className="mt-5 text-black font-pmedium text-md px-6 py-4 border border-gray-300 rounded-md"
                  onPress={() => setTimePickerVisible(true)}
                >
                  <View>
                    <Text className="text-sm font-pregular">Time caught</Text>
                    <Text className="text-lg font-pbold">
                      {timeCaught.toLocaleTimeString()}
                    </Text>
                  </View>
                  {isTimePickerVisible && (
                    <DateTimePicker
                      value={timeCaught}
                      mode="time"
                      display="default"
                      onChange={onChangeTime}
                    />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

      </ScrollView>

      <View className="absolute bottom-4 left-0 right-0 flex items-center">
        <TouchableOpacity
          className="bg-[#1e5aa0] rounded-full py-3 items-center w-11/12 mb-2"
          onPress={handleSaveCatchDetails}
          disabled={loading}
        >
          <View className="flex-row items-center space-x-3">
            {loading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text className="text-white text-lg font-semibold">
                Save Location
              </Text>
            )}
          </View>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  map: {
    width: "100%",
    height: "100%",
  },
  editIcon: {
    position: "absolute",
    top: 16,
    right: 16,
    padding: 8,
    backgroundColor: "white",
    borderRadius: 50,
  },
  input: {
    flex: 1,
    maxWidth: 155,
  },
});

export default CatchDetails;