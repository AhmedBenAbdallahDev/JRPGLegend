              }
              
              throw new Error('No image found for this game');
            } catch (err) {
              console.error('[EnhancedGameCover] Error fetching Wikimedia image:', err);
              setError('Wikimedia cover unavailable');
              setLoading(false);
              return;
            }
          }
        }
      }
      
      // If no special reference but have title and core, try to fetch based on source
      if (game.title && game.core) {
