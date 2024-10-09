import React from "react";
import { View, StyleSheet, Dimensions, Text } from "react-native";
import Animated, {
	useSharedValue,
	useAnimatedStyle,
	withSpring,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH * 0.2;
const CARD_HEIGHT = CARD_WIDTH * 1.1;
const CARD_OFFSET = 40;

interface CardData {
	id: number;
	title: string;
}

interface CardSelectorProps {
	cards: CardData[];
}

interface CardProps {
	index: number;
	card: CardData;
	pressedIndex: Animated.SharedValue<number>;
	draggedIndex: Animated.SharedValue<number>;
	dragX: Animated.SharedValue<number>;
	dragY: Animated.SharedValue<number>;
}

const CardSelector: React.FC<CardSelectorProps> = ({ cards }) => {
	const pressedIndex = useSharedValue(-1);
	const draggedIndex = useSharedValue(-1);
	const dragX = useSharedValue(0);
	const dragY = useSharedValue(0);
	const startX = useSharedValue(0);
	const startY = useSharedValue(0);

	const gesture = Gesture.Pan()
		.onBegin((event) => {
			const index = Math.floor(event.x / CARD_OFFSET);
			pressedIndex.value = Math.max(0, Math.min(index, cards.length - 1));
			startX.value = event.x;
			startY.value = event.y;
		})
		.onUpdate((event) => {
			const index = Math.floor(event.x / CARD_OFFSET);
			const currentIndex = Math.max(0, Math.min(index, cards.length - 1));

			if (draggedIndex.value !== -1) {
				// Card is being dragged
				dragX.value = event.x - startX.value;
				dragY.value = event.y - startY.value;
			} else if (Math.abs(event.translationY) > 10) {
				// Start dragging if moved more than 10 pixels vertically
				draggedIndex.value = pressedIndex.value;
				pressedIndex.value = -1;
				dragX.value = 0;
				dragY.value = 0;
				startX.value = event.x;
				startY.value = event.y;
			} else {
				// Normal left-right selection
				pressedIndex.value = currentIndex;
			}
		})
		.onFinalize(() => {
			pressedIndex.value = -1;
			draggedIndex.value = -1;
			dragX.value = withSpring(0);
			dragY.value = withSpring(0);
		});

	return (
		<View style={styles.container}>
			<GestureDetector gesture={gesture}>
				<View style={styles.cardContainer}>
					{cards.map((card, index) => (
						<Card
							key={card.id}
							index={index}
							card={card}
							pressedIndex={pressedIndex}
							draggedIndex={draggedIndex}
							dragX={dragX}
							dragY={dragY}
						/>
					))}
				</View>
			</GestureDetector>
		</View>
	);
};

const Card: React.FC<CardProps> = ({
	index,
	card,
	pressedIndex,
	draggedIndex,
	dragX,
	dragY,
}) => {
	const animatedStyle = useAnimatedStyle(() => {
		const isPressed = pressedIndex.value === index;
		const isDragged = draggedIndex.value === index;
		const translateY = isPressed ? -30 : 0;

		return {
			transform: [
				{ translateY: withSpring(translateY, { damping: 15, stiffness: 100 }) },
				{ translateX: isDragged ? dragX.value : 0 },
				{ translateY: isDragged ? dragY.value + translateY : 0 },
			],
			zIndex: isDragged ? 1000 : index,
		};
	});

	return (
		<Animated.View
			style={[styles.card, animatedStyle, { left: CARD_OFFSET * index }]}
		>
			<Text style={styles.cardTitle}>{card.title}</Text>
		</Animated.View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
	},
	cardContainer: {
		height: CARD_HEIGHT,
		alignItems: "center",
		paddingLeft: SCREEN_WIDTH / 2 - CARD_WIDTH / 2,
	},
	card: {
		width: CARD_WIDTH,
		height: CARD_HEIGHT,
		backgroundColor: "white",
		borderRadius: 8,
		justifyContent: "center",
		alignItems: "center",
		position: "absolute",
		shadowColor: "#000",
		shadowOffset: {
			width: 0,
			height: 2,
		},
		shadowOpacity: 0.25,
		shadowRadius: 3.84,
		elevation: 5,
	},
	cardTitle: {
		fontSize: 18,
		fontWeight: "bold",
		textAlign: "center",
	},
});

export default CardSelector;
