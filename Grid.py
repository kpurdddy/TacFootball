import time
import random

class Player:
    def __init__(self, pos, name, x, y, speed, strength):
        self.pos = pos  # Q, R, W, L
        self.name = name
        self.x = x
        self.y = y
        self.speed = speed
        self.strength = strength

class GameState:
    def __init__(self):
        self.field_height = 10
        self.field_width = 7
        self.offense = [
            Player('Q', 'QB1', 3, 0, 2, 50),
            Player('W', 'WR1', 1, 0, 5, 40),
            Player('W', 'WR2', 5, 0, 5, 40)
        ]
        self.defense = [
            Player('L', 'LB1', 2, 3, 3, 60),
            Player('L', 'LB2', 4, 3, 3, 60)
        ]

    def render(self):
        grid = [['.' for _ in range(self.field_width)] for _ in range(self.field_height)]
        for p in self.offense: grid[p.y][p.x] = p.pos
        for d in self.defense: grid[d.y][d.x] = d.pos
        
        print("\n" + "="*20)
        for row in reversed(grid):
            print(" ".join(row))
        print("="*20)

    def execute_play(self, play_type):
        print(f"\nExecuting: {play_type}")
        # Simple movement logic based on Speed stat
        for _ in range(3): # 3 "ticks" of movement
            time.sleep(0.5)
            # Offense moves up
            for p in self.offense:
                if p.pos == 'W': p.y = min(p.y + random.randint(1, p.speed // 2), 9)
            # Defense moves toward nearest player
            for d in self.defense:
                d.y = max(d.y - 1, 0)
            self.render()

# Initialization
game = GameState()
game.render()
play = input("Choose Play (1: Hail Mary, 2: Slant): ")
game.execute_play("Hail Mary" if play == "1" else "Slant")